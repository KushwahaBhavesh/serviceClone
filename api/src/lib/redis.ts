import Redis from 'ioredis';
import { env } from '../config/env';
import logger from '../utils/logger';

// ─── Singleton Redis Client ───

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

const redis: Redis =
    globalForRedis.redis ??
    new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
            const delay = Math.min(times * 200, 5000);
            logger.warn(`Redis reconnecting in ${delay}ms (attempt ${times})`);
            return delay;
        },
        lazyConnect: true,
    });

redis.on('connect', () => logger.info('✅ Redis connected'));
redis.on('error', (err) => logger.error('❌ Redis error: %s', err.message));

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}

// ─── Cache Helpers ───

/**
 * Get a cached value by key. Returns null on miss or error.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    try {
        const raw = await redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

/**
 * Set a cached value with TTL (in seconds).
 */
export async function cacheSet(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    try {
        await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch (err) {
        logger.warn('Cache set failed for key=%s: %s', key, (err as Error).message);
    }
}

/**
 * Delete one or more cache keys. Supports exact keys and glob patterns.
 */
export async function cacheDelete(...patterns: string[]): Promise<void> {
    try {
        for (const pattern of patterns) {
            if (pattern.includes('*')) {
                // Pattern-based: scan and delete
                const stream = redis.scanStream({ match: pattern, count: 100 });
                stream.on('data', (keys: string[]) => {
                    if (keys.length > 0) {
                        redis.del(...keys);
                    }
                });
                await new Promise<void>((resolve) => stream.on('end', resolve));
            } else {
                await redis.del(pattern);
            }
        }
    } catch (err) {
        logger.warn('Cache delete failed: %s', (err as Error).message);
    }
}

/**
 * Cache-aside pattern: check cache → miss → fetch from source → store in cache.
 * This is the primary helper for wrapping read operations.
 */
export async function cacheable<T>(
    key: string,
    ttlSeconds: number,
    fetcher: () => Promise<T>,
): Promise<T> {
    const cached = await cacheGet<T>(key);
    if (cached !== null) return cached;

    const fresh = await fetcher();
    // await cacheSet(key, fresh, ttlSeconds);
    return fresh;
}

/**
 * Check if Redis is connected and responsive.
 */
export async function redisHealthCheck(): Promise<'connected' | 'disconnected'> {
    try {
        const pong = await redis.ping();
        return pong === 'PONG' ? 'connected' : 'disconnected';
    } catch {
        return 'disconnected';
    }
}

export default redis;
