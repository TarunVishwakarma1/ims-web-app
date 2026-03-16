'use server';

import { verifyOTP } from '@/lib/otpgenerator';

export type VerifyActionResult =
    | { ok: true }
    | { ok: false; error: 'EXPIRED' | 'NOT_FOUND' | 'INVALID' };

/**
 * Server Action — called directly from the client component.
 * No HTTP round-trip needed; verification runs server-side.
 */
export async function verifyOTPAction(
    email: string,
    otp: string,
): Promise<VerifyActionResult> {
    if (!email || !otp || otp?.length !== 6) {
        return { ok: false, error: 'INVALID' };
    }

    return verifyOTP(email.toLowerCase().trim(), otp);
}
