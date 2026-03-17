import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAccessToken, generateRefreshToken, hashToken, decodeAccessToken } from '@/lib/session';
import { redis } from '@/lib/redis';

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const accessToken = cookieStore.get('access_token')?.value;

    if (!refreshToken || !accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Decode the expired token to get the Session ID
    const payload = decodeAccessToken(accessToken);
    if (!payload?.sid || !payload?.sub) {
        return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 });
    }

    try {
        const storedHash = await redis.get(`session:${payload.sid}`);

        if (!storedHash) {
            // Session revoked or refresh token reuse attempted
            cookieStore.delete('access_token');
            cookieStore.delete('refresh_token');
            return NextResponse.json({ error: 'Session terminated' }, { status: 401 });
        }

        const providedHash = hashToken(refreshToken);
        if (providedHash !== storedHash) {
            // TOKEN THEFT DETECTED
            await redis.del(`session:${payload.sid}`);
            cookieStore.delete('access_token');
            cookieStore.delete('refresh_token');
            return NextResponse.json({ error: 'Token theft detected' }, { status: 401 });
        }

        // Token is valid. Rotate it.
        const newRefreshToken = generateRefreshToken();
        const newAccessToken = await createAccessToken(payload.sub, payload.sid);

        await redis.setEx(`session:${payload.sid}`, 60 * 60 * 24 * 7, hashToken(newRefreshToken));

        cookieStore.set('access_token', newAccessToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60, path: '/'
        });
        cookieStore.set('refresh_token', newRefreshToken, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 24 * 7, path: '/api/auth/refresh'
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        // Fail-closed (Softly) if Redis is down
        console.error('Redis unreachable during refresh:', error);
        return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 });
    }
}