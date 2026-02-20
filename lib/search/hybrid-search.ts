/**
 * Hybrid Search Engine
 * Production-grade search combining text, vector, and business signals
 */

import { supabase } from '@/lib/supabase';
import { generateEmbedding } from './embeddings';
import { HybridSearchRow, ServiceRow } from '@/lib/types/rpc-responses';
import { getCachedSearchResults, cacheSearchResults } from '@/lib/cache/redis';

export interface SearchFilters {
    category?: string;
    location?: string;
    minCapacity?: number;
    maxPrice?: number;
    minRating?: number;
    tags?: string[];
}

export interface SearchRequest {
    query: string;
    filters?: SearchFilters;
    limit?: number;
}

export interface SearchResult {
    id: string;
    service_id: string;
    type: string;
    title: string;
    description: string;
    category: string;
    location: string;
    capacity?: number;
    price?: number;
    rating_avg: number;
    images?: string[];
    tags?: string[];
    scores: {
        text: number;
        vector: number;
        business: number;
        final: number;
    };
}

export interface SearchResponse {
    results: SearchResult[];
    metadata: {
        totalResults: number;
        executionTimeMs: number;
        query: string;
        filters: SearchFilters;
    };
}

/**
 * Main hybrid search function
 * Combines text search, vector search, and business ranking
 */
export async function hybridSearch(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const query = request.query || '';
    const wordCount = query.split(/\s+/).length;
    const hasFilters = !!(request.filters?.category || request.filters?.location);

    // ⚡ CHECK CACHE FIRST (5 min TTL)
    const cachedResults = await getCachedSearchResults(query, request.filters || {});
    if (cachedResults) {
        console.log('[HybridSearch] ⚡ Cache hit!');
        return formatSearchResponse(cachedResults as HybridSearchRow[], query, request.filters || {}, startTime);
    }

    // Cache miss - proceed with search
    // ✅ OPTIMIZATION: "Lazy Embeddings"
    // If it's a simple search (e.g. "movies", "bus Pokhara") and we have filters,
    // try text search first and only use embeddings if results are poor.
    let shouldSkipEmbedding = wordCount <= 2 && hasFilters;

    // Step 1: Generate query embedding (Conditional)
    let queryEmbedding: number[] | null = null;
    if (!shouldSkipEmbedding) {
        try {
            console.log('[HybridSearch] 🧠 Generating embedding for vector search...');
            queryEmbedding = await generateEmbedding(query);
        } catch (error) {
            console.warn('[HybridSearch] Could not generate embedding, falling back to text-only search');
        }
    } else {
        console.log('[HybridSearch] ⚡ Skipping embedding (fast-track/simple query)');
    }

    // Step 2: Execute hybrid search
    const { data, error } = await supabase.rpc('hybrid_search', {
        p_search_query: query,
        p_query_embedding: queryEmbedding,
        p_category: request.filters?.category || null,
        p_location: request.filters?.location || null,
        p_min_capacity: request.filters?.minCapacity || null,
        p_max_price: request.filters?.maxPrice || null,
        p_min_rating: request.filters?.minRating || null,
        p_limit: request.limit || 20
    });

    if (error) {
        console.error('[HybridSearch] Error executing search:', error);
        throw new Error(`Search failed: ${error.message}`);
    }

    // ✅ FALLBACK: If hybrid/text search found nothing but we skipped embedding,
    // try ONCE more with vector search to be sure.
    if ((!data || data.length === 0) && shouldSkipEmbedding) {
        console.log('[HybridSearch] 🔍 No results found, retrying with vector search...');
        try {
            queryEmbedding = await generateEmbedding(query);
            const retry = await supabase.rpc('hybrid_search', {
                p_search_query: query,
                p_query_embedding: queryEmbedding,
                p_category: request.filters?.category || null,
                p_location: request.filters?.location || null,
                p_min_capacity: request.filters?.minCapacity || null,
                p_max_price: request.filters?.maxPrice || null,
                p_min_rating: request.filters?.minRating || null,
                p_limit: request.limit || 20
            });
            if (!retry.error && retry.data?.length > 0) {
                return formatSearchResponse(retry.data, query, request.filters || {}, startTime);
            }
        } catch (e) {
            console.error('[HybridSearch] Retry failed:', e);
        }
    }

    const response = formatSearchResponse(data || [], query, request.filters || {}, startTime);

    // ⚡ CACHE RESULTS (5 min TTL)
    if (data && data.length > 0) {
        cacheSearchResults(query, request.filters || {}, data).catch(err =>
            console.warn('[HybridSearch] Cache write failed:', err)
        );
    }

    return response;
}

/**
 * Helper to format search results consistently
 */
function formatSearchResponse(data: HybridSearchRow[], query: string, filters: SearchFilters, startTime: number): SearchResponse {
    const results: SearchResult[] = data.map((row) => ({
        id: row.id,
        service_id: row.service_id,
        type: row.type,
        title: row.title,
        description: row.description,
        category: row.category,
        location: row.location,
        capacity: row.capacity ?? undefined,
        price: row.price ?? undefined,
        rating_avg: row.rating_avg,
        images: row.images ?? undefined,
        tags: row.tags ?? undefined,
        scores: {
            text: row.text_score,
            vector: row.vector_score,
            business: row.business_score,
            final: row.final_score
        }
    }));

    return {
        results,
        metadata: {
            totalResults: results.length,
            executionTimeMs: Date.now() - startTime,
            query,
            filters
        }
    };
}

/**
 * Simple text-only search (fallback if embeddings not available)
 */
export async function textSearch(query: string, limit: number = 20): Promise<SearchResult[]> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .textSearch('search_vector', query, {
            type: 'websearch',
            config: 'english'
        })
        .limit(limit);

    if (error) {
        console.error('[TextSearch] Error:', error);
        return [];
    }

    return (data || []).map((row: ServiceRow) => ({
        id: row.id,
        service_id: row.service_id,
        type: row.type,
        title: row.title,
        description: row.description,
        category: row.category,
        location: row.location,
        capacity: row.capacity ?? undefined,
        price: row.price ?? undefined,
        rating_avg: row.rating_avg || 0,
        images: row.images ?? undefined,
        tags: row.tags ?? undefined,
        scores: {
            text: 1.0,
            vector: 0,
            business: (row.rating_avg - 1.0) / 4.0,
            final: 0.7
        }
    }));
}

/**
 * Search by category (quick filter)
 */
export async function searchByCategory(category: string, limit: number = 20): Promise<SearchResult[]> {
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('category', category)
        .order('rating_avg', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('[SearchByCategory] Error:', error);
        return [];
    }

    return (data || []).map((row: ServiceRow) => ({
        id: row.id,
        service_id: row.service_id,
        type: row.type,
        title: row.title,
        description: row.description,
        category: row.category,
        location: row.location,
        capacity: row.capacity ?? undefined,
        price: row.price ?? undefined,
        rating_avg: row.rating_avg || 0,
        images: row.images ?? undefined,
        tags: row.tags ?? undefined,
        scores: {
            text: 0,
            vector: 0,
            business: (row.rating_avg - 1.0) / 4.0,
            final: (row.rating_avg - 1.0) / 4.0
        }
    }));
}

/**
 * Get related services based on embedding similarity
 */
export async function findSimilarServices(serviceId: string, limit: number = 10): Promise<SearchResult[]> {
    // Get the service's embedding
    const { data: service, error: fetchError } = await supabase
        .from('services')
        .select('embedding')
        .eq('service_id', serviceId)
        .single();

    if (fetchError || !service?.embedding) {
        console.error('[FindSimilar] Service not found or no embedding');
        return [];
    }

    // Find similar services
    const { data, error } = await supabase.rpc('hybrid_search', {
        p_search_query: '',
        p_query_embedding: service.embedding,
        p_category: null,
        p_location: null,
        p_min_capacity: null,
        p_max_price: null,
        p_min_rating: null,
        p_limit: limit + 1  // +1 to exclude self
    });

    if (error) {
        console.error('[FindSimilar] Error:', error);
        return [];
    }

    // Filter out the original service
    return (data || [])
        .filter((row: HybridSearchRow) => row.service_id !== serviceId)
        .slice(0, limit)
        .map((row: HybridSearchRow) => ({
            id: row.id,
            service_id: row.service_id,
            type: row.type,
            title: row.title,
            description: row.description,
            category: row.category,
            location: row.location,
            capacity: row.capacity,
            price: row.price,
            rating_avg: row.rating_avg,
            images: row.images,
            tags: row.tags,
            scores: {
                text: row.text_score,
                vector: row.vector_score,
                business: row.business_score,
                final: row.final_score
            }
        }));
}
