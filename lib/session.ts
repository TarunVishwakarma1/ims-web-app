import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import crypto from 'node:crypto';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export interface SessionPayload {
    sub: string;
    sid: string; // Session ID (links to Refresh Token in Redis)
    jti: string; // JWT ID (for the Access Token denylist)
    exp?: number;
}

// 1. Create the short-lived Access Token
export async function createAccessToken(userId: string, sessionId: string) {
    return await new SignJWT({ sub: userId, sid: sessionId })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(crypto.randomUUID())
        .setIssuedAt()
        .setExpirationTime('15m') // 15 minutes
        .sign(secret);
}

// 2. Generate a secure random string for the Refresh Token
export function generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
}

// 3. Hash the token for secure database storage
export function hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
}

// 4. Verify cryptographic validity
export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as SessionPayload;
    } catch (error) {
        console.table(error)
        return null;
    }
}

// 5. Decode without verifying (used during refresh when token is already expired)
export function decodeAccessToken(token: string): SessionPayload | null {
    try {
        return decodeJwt(token) as unknown as SessionPayload;
    } catch {
        return null;
    }
}