import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/session';
import { redis } from '@/lib/redis';

export async function proxy(request: NextRequest) {
    const token = request.cookies.get('access_token')?.value;

    if (!token) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
        // Token is missing, invalid, or expired.
        return clearSessionAndRedirect(request);
    }

    // Fail-Open Redis Check for Denylisted Access Tokens
    try {
        const isRevoked = await redis.get(`denylist:${payload.jti}`);
        if (isRevoked) {
            return clearSessionAndRedirect(request);
        }
    } catch (error) {
        console.warn(`Redis unreachable in proxy. Allowing valid JWT for sub: ${payload.sub}`, error);
    }

    // Success: Attach user ID to headers for downstream components
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.sub);

    return response;
}

function clearSessionAndRedirect(request: NextRequest) {
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('access_token');
    return response;
}

export const config = {
    matcher: ['/home/:path*', '/api/protected/:path*'],
};