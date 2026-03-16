import { NextRequest, NextResponse } from 'next/server';
import { generateAndSendOTP } from '@/lib/otpgenerator';

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const email: unknown = body?.email;

    if (typeof email !== 'string' || !email.includes('@')) {
        return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }

    const result = await generateAndSendOTP(email.toLowerCase().trim());

    if (!result.ok) {
        return NextResponse.json(
            { error: 'Failed to send OTP. Please try again later.', detail: result.message },
            { status: 502 },
        );
    }

    return NextResponse.json({ ok: true });
}
