'use server';

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAccessToken, generateRefreshToken, hashToken, verifyAccessToken } from "@/lib/session";
import { redis } from "@/lib/redis";

export async function loginUser(userId: string) {
    const sessionId = crypto.randomUUID();
    const accessToken = await createAccessToken(userId, sessionId);
    const refreshToken = generateRefreshToken();

    // Save hashed Refresh Token to Redis (7 days)
    try {
        await redis.setEx(`session:${sessionId}`, 60 * 60 * 24 * 7, hashToken(refreshToken));
    } catch (error) {
        console.error("Redis failed during login, session will not be refreshable.", error);
    }

    const cookieStore = await cookies();

    cookieStore.set('access_token', accessToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
        maxAge: 15 * 60, path: '/',
    });

    cookieStore.set('refresh_token', refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, path: '/api/auth/refresh', // Restricted path
    });

    redirect('/home');
}

export async function logoutUser() {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;

    if (accessToken) {
        const payload = await verifyAccessToken(accessToken);

        if (payload) {
            try {
                // 1. Destroy the Refresh Token family in Redis
                await redis.del(`session:${payload.sid}`);

                // 2. Denylist the active Access Token until it naturally expires
                const expiresIn = payload.exp! - Math.floor(Date.now() / 1000);
                if (expiresIn > 0) {
                    await redis.setEx(`denylist:${payload.jti}`, expiresIn, 'revoked');
                }
            } catch (error) {
                console.error("Redis unreachable during logout.", error);
            }
        }
    }

    // 3. Clear cookies
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');

    redirect('/');
}