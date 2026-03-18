import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import crypto from 'node:crypto';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export interface SessionPayload { sub: string; sid: string; jti: string; exp?: number; }

export async function createAccessToken(userId: string, sessionId: string) {
    return await new SignJWT({ sub: userId, sid: sessionId })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(crypto.randomUUID())
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(secret);
}

export function generateRefreshToken() { return crypto.randomBytes(32).toString('hex'); }
export function hashToken(token: string) { return crypto.createHash('sha256').update(token).digest('hex'); }

export async function verifyAccessToken(token: string): Promise<SessionPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload as unknown as SessionPayload;
    } catch { return null; }
}

export function decodeAccessToken(token: string): SessionPayload | null {
    try { return decodeJwt(token) as unknown as SessionPayload; } catch { return null; }
}