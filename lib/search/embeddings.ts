/**
 * Embedding Generation Service
 * Generates 768-dimensional embeddings using nomic-embed-text via Ollama
 */

import { generateEmbedding as ollamaGenerateEmbedding, listModels } from '@/lib/integrations/ollama-service';
import { supabase } from '@/lib/supabase';

// nomic-embed-text produces 768-dimensional embeddings
const EMBEDDING_DIMENSIONS = 768;

/**
 * Generate embedding for a text query
 * Uses Ollama with nomic-embed-text model (locally hosted)
 * Falls back to mock embeddings in development
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        // Use Ollama's embedding model (nomic-embed-text)
        const embedding = await ollamaGenerateEmbedding(text.trim(), 'nomic-embed-text');
        return embedding;
    } catch (error) {
        console.error('[Embeddings] Error generating embedding:', error);

        // Fallback: Return zero vector (will not affect search much)
        return new Array(EMBEDDING_DIMENSIONS).fill(0);
    }
}

/**
 * Generate embedding for a service
 * Combines title, description, and tags into searchable text
 */
export async function generateServiceEmbedding(service: {
    title: string;
    description?: string;
    tags?: string[];
}): Promise<number[]> {
    // Combine fields with weights
    const text = [
        service.title,  // Most important
        service.title,  // Repeat for emphasis
        service.description || '',
        (service.tags || []).join(' ')
    ]
        .filter(Boolean)
        .join('. ')
        .trim();

    return generateEmbedding(text);
}

/**
 * Backfill embeddings for all services without them
 * Run this once after migration
 */
export async function backfillServiceEmbeddings(batchSize: number = 50): Promise<void> {
    console.log('[Embeddings] Starting backfill...');
    let totalProcessed = 0;

    while (true) {
        // Fetch services without embeddings
        const { data: services, error } = await supabase
            .from('services')
            .select('id, service_id, title, description, tags')
            .is('embedding', null)
            .limit(batchSize);

        if (error) {
            console.error('[Embeddings] Error fetching services:', error);
            break;
        }

        if (!services || services.length === 0) {
            console.log('[Embeddings] No more services to process');
            break;
        }

        // Process batch
        for (const service of services) {
            try {
                const embedding = await generateServiceEmbedding(service);

                // Update service with embedding
                const { error: updateError } = await supabase
                    .from('services')
                    .update({ embedding })
                    .eq('id', service.id);

                if (updateError) {
                    console.error(`[Embeddings] Error updating service ${service.service_id}:`, updateError);
                } else {
                    totalProcessed++;
                    if (totalProcessed % 10 === 0) {
                        console.log(`[Embeddings] Processed ${totalProcessed} services`);
                    }
                }

                // Rate limiting: wait 100ms between calls
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                console.error(`[Embeddings] Error processing service ${service.service_id}:`, error);
            }
        }

        console.log(`[Embeddings] Batch complete. Total processed: ${totalProcessed}`);
    }

    console.log(`[Embeddings] Backfill complete! Processed ${totalProcessed} services`);
}

/**
 * Update embedding when service is modified
 * Call this in your service update API
 */
export async function updateServiceEmbedding(serviceId: string): Promise<void> {
    const { data: service, error } = await supabase
        .from('services')
        .select('id, title, description, tags')
        .eq('service_id', serviceId)
        .single();

    if (error || !service) {
        console.error('[Embeddings] Service not found:', serviceId);
        return;
    }

    const embedding = await generateServiceEmbedding(service);

    await supabase
        .from('services')
        .update({ embedding })
        .eq('id', service.id);

    console.log(`[Embeddings] Updated embedding for ${serviceId}`);
}

/**
 * For development: Check if Ollama is running
 */
export async function checkEmbeddingService(): Promise<boolean> {
    try {
        const models = await listModels();
        console.log('[Embeddings] Ollama models available:', models);
        return models.length > 0;
    } catch (error) {
        console.error('[Embeddings] Ollama not available:', error);
        return false;
    }
}
