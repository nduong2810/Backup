import env from './environment.js';

let redisClient = null;
let redisConnecting = null;
let redisImportFailed = false;
let redisRetryAfter = 0;
const REDIS_RETRY_DELAY_MS = 30000;
let redisErrorLogged = false;

const connectRedis = async () => {
    if (redisImportFailed) return null;
    const { createClient } = await import('redis');
    redisClient = createClient({
        url: env.REDIS_URL,
        socket: {
            connectTimeout: 800,
            reconnectStrategy: () => false,
        },
    });

    redisClient.on('error', (error) => {
        if (!redisErrorLogged) {
            console.error('[Redis] connection error:', error.message);
            redisErrorLogged = true;
        }
    });

    await redisClient.connect();
    redisErrorLogged = false;
    return redisClient;
};

export const getRedisClient = async () => {
    if (!env.REDIS_URL) return null;
    if (redisClient?.isOpen) return redisClient;
    if (Date.now() < redisRetryAfter) return null;

    if (!redisConnecting) {
        redisConnecting = connectRedis().catch((error) => {
            const missingPackage = error?.code === 'ERR_MODULE_NOT_FOUND' || String(error?.message || '').includes('Cannot find package');
            if (missingPackage) {
                redisImportFailed = true;
                console.warn('[Redis] package not installed, fallback to database.');
            } else {
                console.warn('[Redis] unavailable, fallback to database:', error.message);
                redisRetryAfter = Date.now() + REDIS_RETRY_DELAY_MS;
            }
            redisClient = null;
            redisConnecting = null;
            return null;
        });
    }

    const client = await Promise.race([
        redisConnecting,
        new Promise((resolve) => setTimeout(() => resolve(null), 900)),
    ]);
    redisConnecting = null;
    if (!client) return null;
    return redisClient?.isOpen ? redisClient : null;
};
