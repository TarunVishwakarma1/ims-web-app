'use client';

import { verifyOTPAction } from '@/app/actions/verify-otp';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { REGEXP_ONLY_DIGITS } from 'input-otp';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Step = 'email' | 'otp';

const RESEND_COOLDOWN = 60;
const MAX_RESENDS = 3;

/**
 * Format a duration given in seconds into a compact human-readable string.
 *
 * @param s - Duration in seconds
 * @returns A string in the form "`<m>m <s>s`" when at least one minute is present, otherwise "`<s>s`"
 */
function fmtTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

/**
 * Render the sign-in page with email and one-time passcode (OTP) authentication flows.
 *
 * Manages sending and resending OTPs, cooldown and lockout timers, and verification flow including navigation on success.
 *
 * @returns A React element that renders the sign-in UI with email entry, a 6-digit OTP input, resend controls (with cooldown/lockout display), and buttons for submitting, resending, or switching email. 
 */
export default function SignInPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    // Resend state
    const [resendCount, setResendCount] = useState(0);
    const [cooldown, setCooldown] = useState(0);   // seconds remaining
    const [lockedFor, setLockedFor] = useState(0);   // seconds remaining
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Countdown timer ──────────────────────────────────────────────────────

    const startCooldown = useCallback((seconds: number) => {
        setCooldown(seconds);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setCooldown((s) => {
                if (s <= 1) {
                    clearInterval(cooldownRef.current!);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
    }, []);

    const startLockout = useCallback((seconds: number) => {
        setLockedFor(seconds);
        if (cooldownRef.current) clearInterval(cooldownRef.current);
        cooldownRef.current = setInterval(() => {
            setLockedFor((s) => {
                if (s <= 1) {
                    clearInterval(cooldownRef.current!);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
    }, []);

    useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }, []);

    // ── Step 1: Send OTP ─────────────────────────────────────────────────────

    async function handleEmailSubmit(e: React.SubmitEvent) {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        const toastId = toast.loading('Sending one-time passcode…');

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error ?? 'Failed to send OTP.', { id: toastId });
                return;
            }

            toast.success('Passcode sent! Check your inbox.', { id: toastId });
            setResendCount(0);
            startCooldown(RESEND_COOLDOWN);
            setStep('otp');
        } catch {
            toast.error('Network error. Please try again.', { id: toastId });
        } finally {
            setLoading(false);
        }
    }

    // ── Resend OTP ───────────────────────────────────────────────────────────

    async function handleResend() {
        if (cooldown > 0 || lockedFor > 0) return;
        setLoading(true);
        const toastId = toast.loading('Resending passcode…');

        try {
            const res = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (res.ok) {
                const next = resendCount + 1;
                setResendCount(next);
                startCooldown(RESEND_COOLDOWN);
                toast.success(
                    `Passcode resent (${next}/${MAX_RESENDS} resends used).`,
                    { id: toastId },
                );
                return;
            }

            if (data.error === 'TOO_SOON') {
                startCooldown(data.retryAfterSeconds);
                toast.warning(`Please wait ${fmtTime(data.retryAfterSeconds)} before resending.`, { id: toastId });
            } else if (data.error === 'MAX_RESENDS' || data.error === 'LOCKED') {
                startLockout(data.lockedForSeconds);
                toast.error(
                    `Too many resend attempts. Try again in ${fmtTime(data.lockedForSeconds)}.`,
                    { id: toastId, duration: 8000 },
                );
            } else {
                toast.error(data.error ?? 'Failed to resend OTP.', { id: toastId });
            }
        } catch {
            toast.error('Network error. Please try again.', { id: toastId });
        } finally {
            setLoading(false);
        }
    }

    // ── Step 2: Verify OTP ───────────────────────────────────────────────────

    async function handleVerify(e: React.SubmitEvent) {
        e.preventDefault();
        if (otp.length < 6) return;
        setLoading(true);
        const toastId = toast.loading('Verifying passcode…');

        try {
            const result = await verifyOTPAction(email, otp);

            if (result.ok) {
                toast.success('Signed in successfully! Welcome back.', { id: toastId });
                router.push('/home');
            } else {
                const messages: Record<string, string> = {
                    INVALID: 'Incorrect passcode. Please double-check and try again.',
                    EXPIRED: 'Passcode has expired. Please request a new one.',
                    NOT_FOUND: 'Session not found. Please start over.',
                };
                toast.error(messages[result.error] ?? 'Verification failed.', { id: toastId });
            }
        } catch {
            toast.error('Something went wrong. Please try again.', { id: toastId });
        } finally {
            setLoading(false);
        }
    }

    // ── Render helpers ────────────────────────────────────────────────────────

    const isResendDisabled = loading || cooldown > 0 || lockedFor > 0;

    function resendLabel() {
        if (lockedFor > 0) return `Locked — try again in ${fmtTime(lockedFor)}`;
        if (cooldown > 0) return `Resend in ${fmtTime(cooldown)}`;
        return `Resend passcode (${resendCount}/${MAX_RESENDS} used)`;
    }

    // ── JSX ──────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6">

                <div className="text-center space-y-1">
                    <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                    <p className="text-sm text-muted-foreground">
                        Sign in to your account to continue
                    </p>
                </div>

                <Card>
                    {step === 'email' ? (
                        <form onSubmit={handleEmailSubmit}>
                            <CardHeader>
                                <CardTitle>Sign In</CardTitle>
                                <CardDescription>
                                    Enter your email and we&apos;ll send you a one-time passcode.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                <div className="space-y-2 pb-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                        disabled={loading}
                                    />
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3">
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Sending…' : 'Send One-Time Passcode'}
                                </Button>

                                <div className="flex w-full items-center gap-2">
                                    <Separator className="flex-1" />
                                    <span className="text-xs text-muted-foreground">or</span>
                                    <Separator className="flex-1" />
                                </div>

                                <p className="text-center text-sm text-muted-foreground">
                                    Don&apos;t have an account?{' '}
                                    <Link
                                        href="/signup"
                                        className="font-medium underline underline-offset-4 hover:text-foreground"
                                    >
                                        Sign up
                                    </Link>
                                </p>
                            </CardFooter>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify}>
                            <CardHeader>
                                <CardTitle>Check your email</CardTitle>
                                <CardDescription>
                                    We sent a 6-digit code to{' '}
                                    <span className="font-medium text-foreground">{email}</span>.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center gap-3">
                                    <Label>One-Time Passcode</Label>
                                    <InputOTP
                                        maxLength={6}
                                        pattern={REGEXP_ONLY_DIGITS}
                                        value={otp}
                                        onChange={setOtp}
                                        disabled={loading}
                                    >
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} />
                                            <InputOTPSlot index={1} />
                                            <InputOTPSlot index={2} />
                                            <InputOTPSlot index={3} />
                                            <InputOTPSlot index={4} />
                                            <InputOTPSlot index={5} />
                                        </InputOTPGroup>
                                    </InputOTP>

                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={isResendDisabled}
                                        className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:no-underline disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
                                    >
                                        {resendLabel()}
                                    </button>
                                </div>
                            </CardContent>

                            <CardFooter className="flex flex-col gap-3">
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={otp.length < 6 || loading}
                                >
                                    {loading ? 'Verifying…' : 'Verify & Sign In'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full"
                                    disabled={loading}
                                    onClick={() => {
                                        setStep('email');
                                        setOtp('');
                                        setResendCount(0);
                                        setCooldown(0);
                                        setLockedFor(0);
                                        if (cooldownRef.current) clearInterval(cooldownRef.current);
                                    }}
                                >
                                    ← Use a different email
                                </Button>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}