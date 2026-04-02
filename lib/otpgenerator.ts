import { createHash, randomInt } from 'node:crypto';
import Redis from 'ioredis';

// ---------------------------------------------------------------------------
// Redis client (singleton — safe across Next.js hot-reloads via globalThis)
// ---------------------------------------------------------------------------

declare global {
    // eslint-disable-next-line no-var
    var __redis: Redis | undefined;
}

function getRedisClient(): Redis {
    if (!globalThis.__redis) {
        globalThis.__redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
            maxRetriesPerRequest: 3,
            lazyConnect: false,
        });
        globalThis.__redis.on('error', (err) => {
            console.error('[Redis] connection error:', err);
        });
    }
    return globalThis.__redis;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const OTP_TTL_SECONDS = 10 * 60;          // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60;        // 60 seconds between resends
const MAX_RESENDS = 3;                     // max resend attempts
const LOCKOUT_SECONDS = 5 * 60;           // 5-minute lockout after max resends

const EMAIL_SERVICE_URL =
    process.env.EMAIL_SERVICE_URL ?? 'http://localhost:8080';

// ---------------------------------------------------------------------------
// Redis key helpers
// ---------------------------------------------------------------------------

const hashKey = (email: string) => `otp:${email}:hash`;
const metaKey = (email: string) => `otp:${email}:meta`;
const lockedKey = (email: string) => `otp:${email}:locked`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OTPMeta {
    resendCount: number;
    lastResendAt: number; // unix ms
}

export type SendOTPResult =
    | { ok: true }
    | { ok: false; error: 'EMAIL_SERVICE_ERROR'; message: string };

export type ResendOTPResult =
    | { ok: true }
    | { ok: false; error: 'NOT_FOUND' }
    | { ok: false; error: 'TOO_SOON'; retryAfterSeconds: number }
    | { ok: false; error: 'MAX_RESENDS'; lockedForSeconds: number }
    | { ok: false; error: 'LOCKED'; lockedForSeconds: number }
    | { ok: false; error: 'EMAIL_SERVICE_ERROR'; message: string };

export type VerifyOTPResult =
    | { ok: true }
    | { ok: false; error: 'NOT_FOUND' }
    | { ok: false; error: 'EXPIRED' }
    | { ok: false; error: 'INVALID' };

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Zero-padded, cryptographically random 6-digit OTP string */
function createOTP(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/** SHA-256 hash of the OTP (never store plaintext) */
function hashOTP(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
}

/** Call the email microservice at localhost:8080 */
async function triggerEmail(to: string, otp: string): Promise<void> {
    const res = await fetch(`${EMAIL_SERVICE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, otp }),
    });
    if (!res.ok) {
        throw new Error(`Email service responded with ${res.status}`);
    }
}

/** Write / overwrite the OTP hash + meta in Redis */
async function storeOTP(
    redis: Redis,
    email: string,
    otp: string,
    resendCount = 0,
): Promise<void> {
    const hash = hashOTP(otp);
    const meta: OTPMeta = { resendCount, lastResendAt: Date.now() };

    const pipeline = redis.pipeline();
    pipeline.set(hashKey(email), hash, 'EX', OTP_TTL_SECONDS);
    pipeline.set(metaKey(email), JSON.stringify(meta), 'EX', OTP_TTL_SECONDS);
    await pipeline.exec();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a new OTP for `email`, persist it to Redis (hashed), and
 * trigger the email service. Call this on initial sign-in submission.
 */
export async function generateAndSendOTP(email: string): Promise<SendOTPResult> {
    const redis = getRedisClient();
    const otp = createOTP();

    try {
        await triggerEmail(email, otp);
    } catch (err) {
        return { ok: false, error: 'EMAIL_SERVICE_ERROR', message: String(err) };
    }

    // Only persist after successful email delivery
    await storeOTP(redis, email, otp);
    return { ok: true };
}

/**
 * Resend the OTP — enforces:
 *  • 60-second cooldown between resends
 *  • max 3 resends; on breach → 5-minute lockout
 *  • if already locked → returns remaining lock time
 */
export async function resendOTP(email: string): Promise<ResendOTPResult> {
    const redis = getRedisClient();

    // 1. Check lockout
    const lockTTL = await redis.ttl(lockedKey(email));
    if (lockTTL > 0) {
        return { ok: false, error: 'LOCKED', lockedForSeconds: lockTTL };
    }

    // 2. Fetch meta — must have an active OTP session
    const rawMeta = await redis.get(metaKey(email));
    if (!rawMeta) {
        return { ok: false, error: 'NOT_FOUND' };
    }

    const meta: OTPMeta = JSON.parse(rawMeta);
    const secondsSinceLast = (Date.now() - meta.lastResendAt) / 1000;

    // 3. Check cooldown
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        return {
            ok: false,
            error: 'TOO_SOON',
            retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast),
        };
    }

    // 4. Check resend cap — BEFORE incrementing
    if (meta.resendCount >= MAX_RESENDS) {
        // Impose lockout
        await redis.set(lockedKey(email), '1', 'EX', LOCKOUT_SECONDS);
        // Clean up the otp keys — force fresh start after lockout
        await redis.del(hashKey(email), metaKey(email));
        return { ok: false, error: 'MAX_RESENDS', lockedForSeconds: LOCKOUT_SECONDS };
    }

    // 5. Generate + send new OTP
    const otp = createOTP();
    try {
        await triggerEmail(email, otp);
    } catch (err) {
        return { ok: false, error: 'EMAIL_SERVICE_ERROR', message: String(err) };
    }

    // 6. Persist with incremented resend count
    await storeOTP(redis, email, otp, meta.resendCount + 1);
    return { ok: true };
}

/**
 * Verify the OTP the user typed against the stored hash.
 * Deletes all Redis keys on success.
 */
export async function verifyOTP(
    email: string,
    code: string,
): Promise<VerifyOTPResult> {
    const redis = getRedisClient();

    const [storedHash, hashTTL] = await Promise.all([
        redis.get(hashKey(email)),
        redis.ttl(hashKey(email)),
    ]);

    if (!storedHash) {
        // Key absent — either never generated or already expired
        return hashTTL === -2
            ? { ok: false, error: 'EXPIRED' }
            : { ok: false, error: 'NOT_FOUND' };
    }

    if (hashOTP(code) !== storedHash) {
        return { ok: false, error: 'INVALID' };
    }

    // Valid — clean up all keys immediately
    await redis.del(hashKey(email), metaKey(email), lockedKey(email));
    return { ok: true };
}