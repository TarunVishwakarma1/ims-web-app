import { Card, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function SignUp() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="w-full max-w-md space-y-6">
                <h1 className="text-2xl font-bold tracking-tight">Hi! Register Here</h1>
                <p className="text-sm text-muted-foreground">
                    Register your account
                </p>
                <Card>
                    <CardFooter className="flex flex-col gap-3">
                        <div className="flex w-full items-center gap-2">
                            <Separator className="flex-1" />
                            <span className="text-xs text-muted-foreground">or</span>
                            <Separator className="flex-1" />
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                href="/signin"
                                className="font-medium underline underline-offset-4 hover:text-foreground"
                            >
                                Sign in
                            </Link>
                        </p>
                    </CardFooter>
                </Card >
            </div>
        </div>

    )
}