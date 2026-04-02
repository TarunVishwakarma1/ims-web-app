import { createClient } from 'redis';

const globalForRedis = globalThis as unknown as {
    redis: ReturnType<typeof createClient> | undefined;
};

export const redis =
    globalForRedis.redis ??
    createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
            connectTimeout: 500, // Fail-fast in 500ms
            timeout: 500,
            reconnectStrategy: (retries) => {
                if (process.env.BUILD_PHASE === '1')
                    return false
                return Math.min(retries * 50, 500)
            }
        }
    });

if (process.env.NODE_ENV !== 'production') {
    globalForRedis.redis = redis;
}

redis.on('error', (err) => {
    if (process.env.BUILD_PHASE !== '1') {
        console.warn('Redis Client Error:', err);
    }
    return "Failed"
});

if (!redis.isOpen) {
    await redis.connect().catch(() => { console.warn('Initial Redis connection failed.'); return "failed to connect with redis" });
}