import { headers } from 'next/headers';

export interface ClientContext {
    ip: string;
    userAgent: string;
}

export async function getClientContext(): Promise<ClientContext> {
    const headersList = await headers();

    // Fallbacks to handle proxies, load balancers, and local development
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');

    // Get the first IP in the forwarded list, or default to localhost
    const ip = forwardedFor?.split(',')[0].trim() || realIp || '127.0.0.1';

    // Grab the browser signature
    const userAgent = headersList.get('user-agent') || 'unknown';

    return { ip, userAgent };
}