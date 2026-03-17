// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from '@/lib/session';
import { redis } from '@/lib/redis';

// Define the routes where logged-in users should NOT be allowed
const authRoutes: Set<string> = new Set();
authRoutes.add('/');
authRoutes.add('/signin');
authRoutes.add('/signup');

export async function proxy(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const isAuthRoute = authRoutes.has(path);

    const accessToken = request.cookies.get('access_token')?.value;
    const refreshToken = request.cookies.get('refresh_token')?.value;

    // --- SCENARIO 1: User is visiting Signin/Signup ---
    if (isAuthRoute) {
        // If they have a refresh token or an access token, assume they are logged in.
        // We bounce them to /home immediately. 
        if (accessToken || refreshToken) {
            return NextResponse.redirect(new URL('/home', request.url));
        }

        // If they have no tokens, let them render the login page
        return NextResponse.next();
    }

    // --- SCENARIO 2: User is visiting a Protected Route (/home) ---
    if (!accessToken) {
        return clearSessionAndRedirect(request);
    }

    const payload = await verifyAccessToken(accessToken);

    if (!payload) {
        // Token is invalid or mathematically expired
        return clearSessionAndRedirect(request);
    }

    // Fail-Open Redis Check for Explicit Logout/Revocation
    try {
        const isRevoked = await redis.get(`denylist:${payload.jti}`);
        if (isRevoked) {
            return clearSessionAndRedirect(request);
        }
    } catch (error) {
        console.warn(`Redis unreachable in proxy. Allowing valid JWT for sub: ${payload.sub}`, error);
    }

    // Success: Attach user ID and proceed
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.sub);

    return response;
}

function clearSessionAndRedirect(request: NextRequest) {
    // If they fail auth on a protected route, send them to the root login
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.delete('access_token');
    return response;
}

export const config = {
    // Expand the matcher to intercept auth pages alongside protected pages
    matcher: [
        '/',
        '/signin',
        '/signup',
        '/home/:path*',
        '/api/protected/:path*'
    ],
};