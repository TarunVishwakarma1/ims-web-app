let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void; }> = [];

const processQueue = (error: Error | null) => {
    failedQueue.forEach((prom) => error ? prom.reject(error) : prom.resolve());
    failedQueue = [];
};

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    let response = await fetch(url, options);

    if (response.status !== 401) return response;

    if (isRefreshing) {
        return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
        }).then(() => fetch(url, options)).catch((err) => { throw err });
    }

    isRefreshing = true;

    try {
        const refreshResponse = await fetch('/api/auth/refresh', { method: 'POST' });

        if (refreshResponse.status === 500) {
            throw new Error('Server unavailable, please try again later.');
        }

        if (!refreshResponse.ok) {
            throw new Error('Session expired');
        }

        processQueue(null);
        return fetch(url, options);

    } catch (err) {
        processQueue(err as Error);
        if (globalThis.window !== undefined && (err as Error).message === 'Session expired') {
            globalThis.window.location.href = '/';
        }
        throw err;
    } finally {
        isRefreshing = false;
    }
}