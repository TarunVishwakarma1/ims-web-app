import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getCurrentUserId() {
    const headersList = await headers();
    const userId = headersList.get('x-user-id');

    return userId;
}

export async function requireUser() {
    const userId = await getCurrentUserId();

    if (!userId) {
        // Fallback protection just in case a route slips past the proxy matcher
        redirect('/');
    }

    return userId;
}