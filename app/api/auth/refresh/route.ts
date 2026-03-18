import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAccessToken, generateRefreshToken, hashToken, decodeAccessToken } from '@/lib/session';
import { redis } from '@/lib/redis';
import { getClientContext } from '@/lib/context';

export async function POST() {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refresh_token')?.value;
    const accessToken = cookieStore.get('access_token')?.value;

    if (!refreshToken || !accessToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = decodeAccessToken(accessToken);
    if (!payload?.sid || !payload?.sub) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    try {
        const hashedRefresh = hashToken(refreshToken);
        const sessionDataStr = await redis.get(`refresh:${hashedRefresh}`);

        if (!sessionDataStr) {
            cookieStore.delete('access_token');
            cookieStore.delete('refresh_token');
            return NextResponse.json({ error: 'Session terminated' }, { status: 401 });
        }

        const sessionData = JSON.parse(sessionDataStr);

        // THE UPGRADE: Context Verification
        const { ip: currentIp, userAgent: currentUserAgent } = await getClientContext();

        // Security Check: Did the IP or Browser change?
        if (sessionData.ip !== currentIp || sessionData.userAgent !== currentUserAgent) {
            console.warn(`Token theft prevented for user ${payload.sub}. IP/UA mismatch.`);

            // Go nuclear: destroy the session entirely
            await redis.del(`refresh:${hashedRefresh}`);
            cookieStore.delete('access_token');
            cookieStore.delete('refresh_token');
            return NextResponse.json({ error: 'Context mismatch. Please log in again.' }, { status: 401 });
        }

        // Token and context are valid. Rotate.
        const newRefresh = generateRefreshToken();
        const newAccess = await createAccessToken(payload.sub, payload.sid);

        // Update Redis with the NEW token hash, carrying over the existing context
        const newSessionData = JSON.stringify({ ...sessionData });
        await redis.setEx(`refresh:${hashedRefresh}`, 30, sessionDataStr); // 30s grace period for race conditions
        await redis.setEx(`refresh:${hashToken(newRefresh)}`, 60 * 60 * 24 * 7, newSessionData);

        cookieStore.set('access_token', newAccess, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60, path: '/'
        });
        cookieStore.set('refresh_token', newRefresh, {
            httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 24 * 7, path: '/'
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error Occurred:", error)
        return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 });
    }
}