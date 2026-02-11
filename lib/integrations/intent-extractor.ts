/**
 * Intent Extraction Service
 * Uses Ollama to extract structured intent from Nepanglish user messages
 */

import { Intent } from '@/lib/chat/types';
import { chat, extractJSON } from './ollama-service';
import type { OllamaMessage } from './ollama-service';

export interface IntentExtractionResult {
    intent: Intent;
    data: Record<string, string>;
    confidence: number;
    missing_fields: string[];
    next_question?: string;
}

const SAHARA_SYSTEM_PROMPT = `You are Sahara Assistant, an AI for the Kathmandu Valley providing local services.

SERVICES YOU HANDLE:
- Doctor appointments (categories: general physician, cardiologist, dentist, dermatologist, nephrologist, gynecologist)
- Transportation (bus, flight bookings to/from Kathmandu, Pokhara, Chitwan, Lumbini)
- Entertainment (movie tickets, standup shows, concerts, plays)
- Home services (plumber, electrician, salon, makeup artist, tailor, clinic)

LANGUAGE: Users speak Nepanglish (mix of English and Nepali).
Translation examples:
- "Malai bus chaiyeko Pokhara jana" → "I need a bus to go to Pokhara"
- "Doctor ko appointment book gara" → "Book a doctor appointment"
- "Katiko baje ko show cha?" → "What time is the show?"
- "Kati parcha?" → "How much does it cost?"

YOUR JOB:
1. Understand user intent (what service do they need?)
2. Extract: Service type, Location, Time/Date, Specialty (for doctors), Contact info
3. Identify missing required fields
4. Generate a friendly next question in Nepanglish if data is incomplete

INTENT TYPES:
- BUS_BOOKING (needs: from, to, date, time)
- FLIGHT_BOOKING (needs: from, to, date)
- APPOINTMENT (needs: service_type, specialty, date, time)
- MOVIE_BOOKING (needs: movie_name, date, time, city)
- GENERAL_QUERY (can't determine specific intent)
- UNKNOWN (unclear what user wants)

OUTPUT FORMAT (ALWAYS VALID JSON):
{
  "intent": "BUS_BOOKING",
  "data": {
    "from": "Kathmandu",
    "to": "Pokhara",
    "date": "tomorrow",
    "time": null
  },
  "confidence": 0.95,
  "missing_fields": ["time"],
  "next_question": "Katiko baje ko bus chaiyeko? (What time do you need the bus?)"
}

CRITICAL RULES:
- ONLY output valid JSON (no extra text before or after)
- Use null for missing data fields
- Confidence between 0 and 1
- If user just greets, use GENERAL_QUERY intent
- Be culturally aware (Nepali context, locations in Nepal)
`;

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
