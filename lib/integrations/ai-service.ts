/**
 * Smart AI Service
 * Automatically chooses between Ollama (local) and Gemini (production)
 * Falls back gracefully based on environment
 */

import { chat as ollamaChat, OllamaMessage } from './ollama-service';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const IS_LOCALHOST = OLLAMA_URL.includes('localhost') || OLLAMA_URL.includes('127.0.0.1');

// Use Gemini in production or when Ollama is on localhost
const USE_GEMINI = IS_PRODUCTION || IS_LOCALHOST;

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Gemini API Chat (production fallback)
 */
async function geminiChat(
    messages: Message[],
    options?: { temperature?: number; responseFormat?: string }
): Promise<string> {
    const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not found. Set NEXT_PUBLIC_GEMINI_API_KEY in environment variables.');
    }

    // Convert messages to Gemini format
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Build prompt
    let prompt = systemMessage ? `${systemMessage}\n\n` : '';
    conversationMessages.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n\n`;
    });
    prompt += 'Assistant:';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: options?.temperature || 0.7,
                maxOutputTokens: 2048,
            }
        })
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('[Gemini] API Error:', error);
        throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log('[AI Service] ✓ Gemini response received');
    return text;
}

/**
 * Smart AI Chat - Uses Ollama locally, Gemini in production
 */
export async function chat(
    messages: Message[],
    options?: {
        model?: string;
        temperature?: number;
        responseFormat?: string;
    }
): Promise<string> {
    console.log(`[AI Service] Using ${USE_GEMINI ? 'Gemini' : 'Ollama'} (${IS_PRODUCTION ? 'production' : 'development'})`);

    try {
        if (USE_GEMINI) {
            // Use Gemini in production
            return await geminiChat(messages, options);
        } else {
            // Use Ollama locally
            const response = await ollamaChat(
                messages as OllamaMessage[],
                options?.model,
                options?.temperature,
                options?.responseFormat
            );
            return response.message.content;
        }
    } catch (error) {
        console.error('[AI Service] Error:', error);

        // Fallback: If Ollama fails, try Gemini
        if (!USE_GEMINI) {
            console.log('[AI Service] Ollama failed, falling back to Gemini...');
            try {
                return await geminiChat(messages, options);
            } catch (geminiError) {
                console.error('[AI Service] Gemini fallback also failed:', geminiError);
                throw new Error('Both Ollama and Gemini failed. Please check your configuration.');
            }
        }

        throw error;
    }
}

/**
 * Check if AI service is available
 */
export async function checkAIService(): Promise<{ available: boolean; service: string }> {
    if (USE_GEMINI) {
        return {
            available: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
            service: 'Gemini'
        };
    } else {
        try {
            await ollamaChat([{ role: 'user', content: 'test' }], 'llama3.2:latest', 0.7);
            return { available: true, service: 'Ollama' };
        } catch {
            return { available: false, service: 'Ollama (unavailable)' };
        }
    }
}
