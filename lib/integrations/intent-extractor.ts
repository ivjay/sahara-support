/**
 * Intent Extraction Service
 * Uses Ollama to extract structured intent from Nepanglish user messages
 * Updated with v2.0 bilingual system prompt for Feb 18, 2026 demo
 */

import { Intent } from '@/lib/chat/types';
import { chat, extractJSON } from './ollama-service';
import type { OllamaMessage } from './ollama-service';
import { SAHARA_SYSTEM_PROMPT, detectLanguage, parseBookingResponse } from '@/lib/chat/system-prompt-v2';

export interface IntentExtractionResult {
    intent: Intent;
    data: Record<string, string>;
    confidence: number;
    missing_fields: string[];
    next_question?: string;
}

// Re-export utilities from system prompt for convenience
export { detectLanguage, parseBookingResponse };

/**
 * Extract intent from user message using Ollama
 */
export async function extractIntent(
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<IntentExtractionResult> {
    try {
        // Build messages with conversation context
        const messages: OllamaMessage[] = [
            { role: 'system', content: SAHARA_SYSTEM_PROMPT },
        ];

        // Add conversation history (last 3 turns for context)
        const recentHistory = conversationHistory.slice(-6); // 3 user + 3 assistant
        for (const msg of recentHistory) {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
            });
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage,
        });

        console.log('[IntentExtractor] Processing message:', userMessage);

        // Get response from Ollama
        const response = await chat(messages, { temperature: 0.3 }); // Lower temp for more deterministic output

        // Extract JSON from response
        const result = extractJSON<IntentExtractionResult>(response.message.content);

        if (!result) {
            throw new Error('Failed to extract valid JSON from Ollama response');
        }

        // Validate intent type
        const validIntents: Intent[] = [
            'BUS_BOOKING',
            'FLIGHT_BOOKING',
            'APPOINTMENT',
            'MOVIE_BOOKING',
            'GREETING',
            'GENERAL_QUERY',
            'UNKNOWN',
        ];

        if (!validIntents.includes(result.intent)) {
            console.warn(`[IntentExtractor] Invalid intent: ${result.intent}, defaulting to UNKNOWN`);
            result.intent = 'UNKNOWN';
        }

        console.log('[IntentExtractor] ✓ Extracted intent:', result.intent, 'with confidence', result.confidence);

        return result;
    } catch (error) {
        console.error('[IntentExtractor] ✗ Error extracting intent:', error);

        // Fallback to simple keyword matching
        return fallbackIntentExtraction(userMessage);
    }
}

/**
 * Fallback intent extraction using simple keyword matching
 * Used when Ollama fails or is unavailable
 */
function fallbackIntentExtraction(userMessage: string): IntentExtractionResult {
    const lowerMessage = userMessage.toLowerCase();

    // Simple keyword matching
    if (lowerMessage.match(/\b(bus|micro)\b/i)) {
        return {
            intent: 'BUS_BOOKING',
            data: {},
            confidence: 0.5,
            missing_fields: ['from', 'to', 'date', 'time'],
            next_question: 'Kahaa bata kahaa jana lai bus chaiyeko? (Where do you need the bus from and to?)',
        };
    }

    if (lowerMessage.match(/\b(flight|plane|udaan)\b/i)) {
        return {
            intent: 'FLIGHT_BOOKING',
            data: {},
            confidence: 0.5,
            missing_fields: ['from', 'to', 'date'],
            next_question: 'Kahaa bata kahaa jana lai flight chaiyeko? (Where do you need the flight from and to?)',
        };
    }

    if (lowerMessage.match(/\b(doctor|appointment|daktar|hospital)\b/i)) {
        return {
            intent: 'APPOINTMENT',
            data: { service_type: 'doctor' },
            confidence: 0.6,
            missing_fields: ['specialty', 'date', 'time'],
            next_question: 'Kun type ko doctor chaiyeko? (What type of doctor do you need?)',
        };
    }

    if (lowerMessage.match(/\b(movie|cinema|film|show)\b/i)) {
        return {
            intent: 'MOVIE_BOOKING',
            data: {},
            confidence: 0.5,
            missing_fields: ['movie_name', 'date', 'time', 'city'],
            next_question: 'Kun movie herna chahanuhuncha? (Which movie would you like to watch?)',
        };
    }

    if (lowerMessage.match(/\b(hello|hi|namaste|hey)\b/i)) {
        return {
            intent: 'GREETING',
            data: {},
            confidence: 0.8,
            missing_fields: [],
        };
    }

    return {
        intent: 'UNKNOWN',
        data: {},
        confidence: 0.3,
        missing_fields: [],
        next_question: 'Tapailai k help chaiyeko? (What help do you need?)',
    };
}

export default {
    extractIntent,
};
