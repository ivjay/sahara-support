/**
 * Search Module - Production-grade hybrid search
 *
 * Usage:
 * import { searchServices } from '@/lib/search';
 * const results = await searchServices("cheap venue in Thamel");
 */

export { hybridSearch, textSearch, searchByCategory, findSimilarServices } from './hybrid-search';
export type { SearchFilters, SearchRequest, SearchResult, SearchResponse } from './hybrid-search';

export { extractSearchIntent } from './search-intent-extractor';
export type { SearchIntent } from './search-intent-extractor';

export { generateEmbedding, generateServiceEmbedding, backfillServiceEmbeddings, updateServiceEmbedding } from './embeddings';

/**
 * Main search function that combines everything
 * Use this as the primary search API
 */
import { hybridSearch } from './hybrid-search';
import { extractSearchIntent } from './search-intent-extractor';

export async function searchServices(query: string, limit?: number) {
    // Extract intent and filters
    const intent = await extractSearchIntent(query);

    console.log('[Search] Query:', query);
    console.log('[Search] Intent:', intent);

    // Execute hybrid search
    let results = await hybridSearch({
        query: intent.searchQuery,
        filters: intent.filters,
        limit
    });

    // ✅ RESCUE SEARCH: If nothing found but we know the category, 
    // try a broad category search as a fallback.
    if (results.results.length === 0 && intent.filters.category) {
        console.log(`[Search] 🚨 0 results for '${intent.searchQuery}', trying broad category fallback: ${intent.filters.category}`);
        const { searchByCategory } = await import('./hybrid-search');
        const broadResults = await searchByCategory(intent.filters.category, limit);

        if (broadResults.length > 0) {
            results = {
                results: broadResults,
                metadata: {
                    ...results.metadata,
                    totalResults: broadResults.length,
                    query: intent.filters.category // Label as category search
                }
            };
        }
    }

    return results;
}
