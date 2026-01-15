/**
 * Chat Service - Handles rate limiting and request management for Gemini API
 */

export interface RateLimitState {
    requestCount: number;
    windowStart: number;
    isLimited: boolean;
}

class ChatRateLimiter {
    private requestCount = 0;
    private windowStart: number = Date.now();
    // 5 Requests per minute to stay safe within strict quotas (15 RPM is max)
    private readonly maxRequestsPerMinute = 5;
    private readonly windowMs = 60 * 1000; // 1 minute window

    /**
     * Check if we can make a request
     */
    canMakeRequest(): boolean {
        this.resetWindowIfNeeded();
        return this.requestCount < this.maxRequestsPerMinute;
    }

    /**
     * Record a successful request
     */
    recordRequest(): void {
        this.resetWindowIfNeeded();
        this.requestCount++;
        console.log(`[RateLimiter] Request recorded. Count: ${this.requestCount}/${this.maxRequestsPerMinute}`);
    }

    /**
     * Get wait time in milliseconds if rate limited
     */
    getWaitTimeMs(): number {
        if (this.canMakeRequest()) return 0;
        const elapsed = Date.now() - this.windowStart;
        return Math.max(0, this.windowMs - elapsed);
    }

    /**
     * Get current state for debugging
     */
    getState(): RateLimitState {
        return {
            requestCount: this.requestCount,
            windowStart: this.windowStart,
            isLimited: !this.canMakeRequest()
        };
    }

    private resetWindowIfNeeded(): void {
        const now = Date.now();
        if (now - this.windowStart >= this.windowMs) {
            console.log(`[RateLimiter] Resetting window. Old count: ${this.requestCount}`);
            this.requestCount = 0;
            this.windowStart = now;
        }
    }
}

// Global singleton pattern to survive hot reloads in development
const globalForRateLimiter = globalThis as unknown as {
    prisma: ChatRateLimiter | undefined;
    rateLimiter: ChatRateLimiter | undefined;
};

export const rateLimiter = globalForRateLimiter.rateLimiter ?? new ChatRateLimiter();

if (process.env.NODE_ENV !== 'production') {
    globalForRateLimiter.rateLimiter = rateLimiter;
}

/**
 * Delay helper for exponential backoff
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry wrapper
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 2000 // Increased base delay
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            // Check rate limit before each attempt
            if (!rateLimiter.canMakeRequest()) {
                const waitTime = rateLimiter.getWaitTimeMs();
                console.log(`[ChatService] Rate limited locally, waiting ${waitTime}ms...`);
                // If wait time is too long (> 10s), just fail to avoid hanging the UI
                if (waitTime > 10000) {
                    throw new Error("Local rate limit exceeded. Please wait a moment.");
                }
                await delay(waitTime);
            }

            rateLimiter.recordRequest();
            return await fn();
        } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`[ChatService] Attempt ${attempt + 1} failed:`, lastError.message);

            // Check if it's a rate limit error (429)
            const isRateLimitError = lastError.message.includes('429') ||
                lastError.message.includes('Too Many Requests') ||
                lastError.message.includes('quota');

            if (isRateLimitError && attempt < maxRetries) {
                // Exponential backoff: 2s, 4s, 8s, 16s...
                const backoffMs = baseDelayMs * Math.pow(2, attempt);
                console.log(`[ChatService] API 429 error, retry ${attempt + 1}/${maxRetries} in ${backoffMs}ms`);
                await delay(backoffMs);
            } else if (!isRateLimitError) {
                // Non-rate-limit error, throw immediately
                throw lastError;
            }
        }
    }

    throw lastError || new Error('Max retries exceeded');
}

/**
 * Format error message for user-friendly display
 */
export function formatApiError(error: unknown): string {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('limit')) {
        return "⚠️ System is busy (High Traffic). Please waiting 30 seconds before trying again.";
    }

    if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        return "I'm having trouble connecting. Please check your internet connection.";
    }

    return "Sorry, something went wrong. Please try again.";
}
