/**
 * Ollama API Service
 * Communicates with local Ollama instance (localhost:11434)
 * Uses legacy HTTP module to avoid Node.js 22 fetch issues
 */

import http from 'http';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:latest';

export interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OllamaChatRequest {
    model: string;
    messages: OllamaMessage[];
    stream?: boolean;
    options?: {
        temperature?: number;
        top_p?: number;
        max_tokens?: number;
    };
    format?: 'json' | string;
}

export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: OllamaMessage;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    eval_count?: number;
}

/**
 * Make HTTP request using legacy http module (Node.js 22 workaround)
 */
async function httpRequest(
    url: string,
    method: string = 'GET',
    body?: any,
    headers?: Record<string, string>
): Promise<any> {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || 80,
            path: urlObj.pathname + urlObj.search,
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers,
            },
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (!data) {
                    console.warn(`[Ollama] Empty response from ${url}`);
                    resolve({ message: { role: 'assistant', content: '' }, done: true });
                    return;
                }

                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (error) {
                    console.error('[Ollama] JSON Parse Error:', error, 'Raw data:', data);
                    // If not JSON, but has content, wrap it
                    resolve({
                        message: { role: 'assistant', content: data },
                        done: true,
                        error: 'Failed to parse JSON response'
                    });
                }
            });
        });

        // Set timeout to prevent hanging the whole app (60s for local LLMs)
        req.setTimeout(60000, () => {
            req.destroy();
            reject(new Error('Ollama request timed out after 60 seconds. The model might be loading or the server is slow. Check your CPU/GPU usage.'));
        });

        req.on('error', (error) => {
            console.error('[Ollama] HTTP Request Error:', error);
            reject(error);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

/**
 * Chat completion with retry logic
 */
export async function chat(
    messages: OllamaMessage[],
    options?: {
        temperature?: number;
        stream?: boolean;
        retries?: number;
        forceJson?: boolean;
    }
): Promise<OllamaChatResponse> {
    const maxRetries = options?.retries || 1; // ✅ REDUCED: Only 1 attempt for faster responses
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const startTime = Date.now();

            const requestBody: OllamaChatRequest = {
                model: OLLAMA_MODEL,
                messages,
                stream: options?.stream || false,
                // ✅ FIXED: Only force JSON when explicitly requested (faster inference)
                ...(options?.forceJson && { format: 'json' }),
                options: {
                    temperature: options?.temperature || 0.7,
                },
            };

            console.log(`[Ollama] Sending request to ${OLLAMA_BASE_URL}/api/chat`);

            const response = await httpRequest(
                `${OLLAMA_BASE_URL}/api/chat`,
                'POST',
                requestBody
            );

            const endTime = Date.now();
            console.log(`[Ollama] ✓ Inference completed in ${endTime - startTime}ms`);

            let chatResponse = response;

            // Ensure response has the expected structure
            if (!chatResponse || typeof chatResponse !== 'object') {
                // If it's a string, wrap it
                if (typeof chatResponse === 'string') {
                    chatResponse = { message: { role: 'assistant', content: chatResponse } };
                } else {
                    throw new Error('Invalid response from Ollama server');
                }
            }

            if (!chatResponse.message) {
                // If it's the tag response or something else, wrap it
                if (chatResponse.content) {
                    chatResponse.message = { role: 'assistant', content: chatResponse.content };
                } else {
                    console.warn('[Ollama] Unexpected response structure:', chatResponse);
                    chatResponse.message = { role: 'assistant', content: JSON.stringify(chatResponse) };
                }
            }

            return chatResponse as OllamaChatResponse;
        } catch (error) {
            lastError = error as Error;
            console.error(`[Ollama] ✗ Request failed:`, error);

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`[Ollama] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw new Error(`Ollama request failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Simple completion (single message)
 */
export async function complete(
    prompt: string,
    systemPrompt?: string,
    options?: { temperature?: number }
): Promise<string> {
    const messages: OllamaMessage[] = [];

    if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    const response = await chat(messages, options);
    return response.message.content;
}

/**
 * Check Ollama health
 */
export async function healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    model: string;
    error?: string;
}> {
    try {
        const response = await httpRequest(`${OLLAMA_BASE_URL}/api/tags`, 'GET');

        if (response && response.models) {
            const hasModel = response.models.some((m: any) => m.name === OLLAMA_MODEL);

            if (hasModel) {
                console.log(`[Ollama] ✓ Health check passed - ${OLLAMA_MODEL} available`);
                return { status: 'healthy', model: OLLAMA_MODEL };
            } else {
                const availableModels = response.models.map((m: any) => m.name).join(', ');
                console.warn(`[Ollama] ⚠ Model ${OLLAMA_MODEL} not found. Available: ${availableModels}`);
                return {
                    status: 'unhealthy',
                    model: OLLAMA_MODEL,
                    error: `Model not found. Available: ${availableModels}`,
                };
            }
        }

        return { status: 'unhealthy', model: OLLAMA_MODEL, error: 'Invalid response from Ollama' };
    } catch (error) {
        console.error('[Ollama] ✗ Health check failed:', error);
        return {
            status: 'unhealthy',
            model: OLLAMA_MODEL,
            error: (error as Error).message,
        };
    }
}

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 */
export function extractJSON<T = any>(response: string): T | null {
    try {
        // Try direct parse first
        return JSON.parse(response);
    } catch {
        // Try to extract from markdown code block
        const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
            try {
                return JSON.parse(codeBlockMatch[1]);
            } catch {
                console.error('[Ollama] Failed to parse JSON from code block');
            }
        }

        // Try to find JSON object in text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                console.error('[Ollama] Failed to parse JSON from text');
            }
        }

        console.error('[Ollama] No valid JSON found in response');
        return null;
    }
}

export default {
    chat,
    complete,
    healthCheck,
    extractJSON,
};
