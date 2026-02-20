/**
 * Redis Cache Client
 * Speeds up: search, seats, services, sessions
 */

import Redis from 'ioredis';

// Initialize Redis connection
// Your Redis Labs connection:
// redis://default:tdmRgHEeDQaW8OAAWFQ4bbLXTzstxqE7@redis-19549.crce179.ap-south-1-1.ec2.cloud.redislabs.com:19549
const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy: (times) => {
            if (times > 3) return null; // Stop retrying after 3 attempts
            return Math.min(times * 50, 2000); // Exponential backoff
        }
    })
    : null;

const CACHE_ENABLED = !!redis;

// Handle Redis connection events
if (redis) {
    redis.on('error', (err) => console.warn('[Redis] Connection error:', err.message));
    redis.on('connect', () => console.log('[Redis] ⚡ Connected successfully'));
}

/**
 * Cache key prefixes
 */
const KEYS = {
    SEARCH: (query: string, filters: string) => `search:${query}:${filters}`,
    SEATS: (venueId: string, serviceId: string, date: string, time: string) =>
        `seats:${venueId}:${serviceId}:${date}:${time}`,
    SERVICES: 'services:all',
    SERVICE: (id: string) => `service:${id}`,
    USER_SESSION: (userId: string) => `session:${userId}`,
};

/**
 * Cache TTLs (in seconds)
 */
const TTL = {
    SEARCH: 300,        // 5 minutes - search results
    SEATS: 60,          // 1 minute - seat availability changes frequently
    SERVICES: 3600,     // 1 hour - service list doesn't change often
    SESSION: 86400,     // 24 hours - user sessions
};

/**
 * Get from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
    if (!CACHE_ENABLED || !redis) return null;

    try {
        const data = await redis.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    } catch (error) {
        console.warn('[Redis] Get failed:', error);
        return null;
    }
}

/**
 * Set cache with TTL
 */
export async function setCache(key: string, value: any, ttl: number): Promise<void> {
    if (!CACHE_ENABLED || !redis) return;

    try {
        await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
        console.warn('[Redis] Set failed:', error);
    }
}

/**
 * Delete from cache
 */
export async function deleteCache(key: string): Promise<void> {
    if (!CACHE_ENABLED || !redis) return;

    try {
        await redis.del(key);
    } catch (error) {
        console.warn('[Redis] Delete failed:', error);
    }
}

/**
 * Delete multiple keys matching pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
    if (!CACHE_ENABLED || !redis) return;

    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        console.warn('[Redis] Delete pattern failed:', error);
    }
}

/**
 * Cache search results
 */
export async function cacheSearchResults(query: string, filters: any, results: any[]) {
    const filterKey = JSON.stringify(filters);
    const key = KEYS.SEARCH(query, filterKey);
    await setCache(key, results, TTL.SEARCH);
}

/**
 * Get cached search results
 */
export async function getCachedSearchResults(query: string, filters: any): Promise<any[] | null> {
    const filterKey = JSON.stringify(filters);
    const key = KEYS.SEARCH(query, filterKey);
    return getCache<any[]>(key);
}

/**
 * Cache seat inventory
 */
export async function cacheSeatInventory(
    venueId: string,
    serviceId: string,
    eventDate: string,
    eventTime: string,
    seats: any[]
) {
    const key = KEYS.SEATS(venueId, serviceId, eventDate, eventTime);
    await setCache(key, seats, TTL.SEATS);
}

/**
 * Get cached seat inventory
 */
export async function getCachedSeatInventory(
    venueId: string,
    serviceId: string,
    eventDate: string,
    eventTime: string
): Promise<any[] | null> {
    const key = KEYS.SEATS(venueId, serviceId, eventDate, eventTime);
    return getCache<any[]>(key);
}

/**
 * Invalidate seat cache (after reservation)
 */
export async function invalidateSeatCache(
    venueId: string,
    serviceId: string,
    eventDate: string,
    eventTime: string
) {
    const key = KEYS.SEATS(venueId, serviceId, eventDate, eventTime);
    await deleteCache(key);
}

/**
 * Cache all services
 */
export async function cacheServices(services: any[]) {
    await setCache(KEYS.SERVICES, services, TTL.SERVICES);
}

/**
 * Get cached services
 */
export async function getCachedServices(): Promise<any[] | null> {
    return getCache<any[]>(KEYS.SERVICES);
}

/**
 * Invalidate services cache
 */
export async function invalidateServicesCache() {
    await deleteCache(KEYS.SERVICES);
}

/**
 * Check if Redis is available
 */
export function isCacheEnabled(): boolean {
    return CACHE_ENABLED;
}

export { KEYS, TTL };
