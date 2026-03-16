import { NextRequest, NextResponse } from 'next/server';
import { resendOTP } from '@/lib/otpgenerator';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const email: unknown = body?.email;

    if (typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const result = await resendOTP(email.toLowerCase().trim());

    if (result.ok) {
        return NextResponse.json({ ok: true });
    }

    switch (result.error) {
        case 'NOT_FOUND':
            return NextResponse.json(
                { error: 'No active OTP session. Please start over.' },
                { status: 404 },
            );
        case 'TOO_SOON':
            return NextResponse.json(
                { error: 'TOO_SOON', retryAfterSeconds: result.retryAfterSeconds },
                { status: 429 },
            );
        case 'MAX_RESENDS':
            return NextResponse.json(
                { error: 'MAX_RESENDS', lockedForSeconds: result.lockedForSeconds },
                { status: 429 },
            );
        case 'LOCKED':
            return NextResponse.json(
                { error: 'LOCKED', lockedForSeconds: result.lockedForSeconds },
                { status: 429 },
            );
        case 'EMAIL_SERVICE_ERROR':
            return NextResponse.json(
                { error: 'Failed to resend OTP. Please try again.' },
                { status: 502 },
            );
    }
}
