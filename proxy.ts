import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken, hashToken, generateRefreshToken, createAccessToken } from '@/lib/session';
import { redis } from '@/lib/redis';

const authRoutes = new Set(['/', '/signin', '/signup']);

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isAuthRoute = authRoutes.has(path);

    let accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    let payload = accessToken ? await verifyAccessToken(accessToken) : null;
    let tokensRotated = false;

    if (!payload && refreshToken) {
        try {
            const hashedRefresh = hashToken(refreshToken);
            const sessionDataStr = await redis.get(`refresh:${hashedRefresh}`);

            if (sessionDataStr) {
                const sessionData = JSON.parse(sessionDataStr);
                const newRefresh = generateRefreshToken();
                accessToken = await createAccessToken(sessionData.sub, sessionData.sid);

                await redis.setEx(`refresh:${hashedRefresh}`, 30, sessionDataStr);
                await redis.setEx(`refresh:${hashToken(newRefresh)}`, 60 * 60 * 24 * 7, sessionDataStr);

                payload = { sub: sessionData.sub, sid: sessionData.sid, jti: 'new' };
                tokensRotated = true;
                request.cookies.set('refresh_token', newRefresh);
            }
        } catch (error) { console.error('Redis unreachable during middleware rotation', error); }
    }

    if (isAuthRoute) {
        if (payload) return NextResponse.redirect(new URL('/home', request.url));
        return NextResponse.next();
    }

    if (!payload) return clearSessionAndHandle(request);

    try {
        const isRevoked = await redis.get(`denylist:${payload.jti}`);
        if (isRevoked) return clearSessionAndHandle(request);
    } catch (error) { console.warn(`Redis unreachable in proxy. Allowing valid JWT.`, error); }

    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.sub);

    if (tokensRotated) {
        response.cookies.set('access_token', accessToken!, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 15 * 60, path: '/' });
        response.cookies.set('refresh_token', request.cookies.get('refresh_token')!.value, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 24 * 7, path: '/' });
    }

    return response;
}

function clearSessionAndHandle(request: NextRequest) {
    const isApiRequest = request.nextUrl.pathname.startsWith('/api/');
    let response = isApiRequest ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) : NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('access_token');
    response.cookies.delete('refresh_token');
    return response;
}

export const config = { matcher: ['/', '/signin', '/signup', '/dashboard/:path*', '/api/protected/:path*'] };