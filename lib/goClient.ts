import { headers } from 'next/headers';
import crypto from 'node:crypto'

const GO_API_URL = process.env.GO_API_URL || 'http://localhost:8081';
const HMAC_SECRET = process.env.HMAC_SECRET || 'super-secret-local-dev-key-change-me';

/**
 * A secure internal fetch client for Next.js -> Go communication.
 * It automatically signs requests to prove they came from Next.js.
 */
export async function fetchGoAPI(endpoint: string, options: RequestInit = {}) {
    const timestamp = Date.now().toString();
    const method = options.method || 'GET';
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // 1. Create the string to sign (Method + Path + Timestamp)
    const signaturePayload = `${method}:${path}:${timestamp}`;

    // 2. Generate the HMAC SHA-256 hash
    const signature = crypto
        .createHmac('sha256', HMAC_SECRET)
        .update(signaturePayload)
        .digest('hex');

    // 3. Forward the user's ID if we have it from the proxy
    const headersList = await headers();
    const userId = headersList.get('x-user-id') || '';

    // 4. Merge our secure headers with any custom options
    const secureHeaders = {
        ...options.headers,
        'Content-Type': 'application/json',
        'x-timestamp': timestamp,
        'x-signature': signature,
        'x-user-id': userId, // Go will trust this because the signature proves Next.js sent it
    };

    // 5. Execute the fetch to the internal Go service
    return fetch(`${GO_API_URL}${path}`, {
        ...options,
        headers: secureHeaders,
    });
}