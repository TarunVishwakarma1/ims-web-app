'use server';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAccessToken, generateRefreshToken, hashToken, verifyAccessToken } from "@/lib/session";
import { redis } from "@/lib/redis";
import { getClientContext } from "@/lib/context";

export async function loginUser(userId: string) {
    const sessionId = crypto.randomUUID();
    const accessToken = await createAccessToken(userId, sessionId);
    const refreshToken = generateRefreshToken();

    // THE UPGRADE: Capture the client's fingerprint
    const { ip, userAgent } = await getClientContext();

    // Save the context alongside the session data
    const sessionData = JSON.stringify({ sub: userId, sid: sessionId, ip, userAgent });

    try {
        await redis.setEx(`refresh:${hashToken(refreshToken)}`, 60 * 60 * 24 * 7, sessionData);
    } catch (error) {
        console.error("Redis failed during login.", error);
    }

    const cookieStore = await cookies();

    cookieStore.set('access_token', accessToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
        maxAge: 15 * 60, path: '/',
    });

    cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, path: '/',
    });
}

export async function logoutUser() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    try {
        if (refreshToken) await redis.del(`refresh:${hashToken(refreshToken)}`);

        if (accessToken) {
            const payload = await verifyAccessToken(accessToken);
            if (payload) {
                const expiresIn = payload.exp! - Math.floor(Date.now() / 1000);
                if (expiresIn > 0) {
                    await redis.setEx(`denylist:${payload.jti}`, expiresIn, 'revoked');
                }
            }
        }
    } catch (error) {
        console.error("Redis unreachable during logout.", error);
    }

    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
    redirect('/');
}