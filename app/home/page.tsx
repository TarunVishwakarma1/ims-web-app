// app/home/page.tsx
import { Button } from '@/components/ui/button';
import { requireUser } from '@/lib/auth';

export default async function HomePage() {
    const userId = await requireUser();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">
                Welcome back,
            </h1>
            <p>Your secure ID is: {userId}</p>
            <Button type='button' variant="destructive">Log Out</Button>
        </div>
    );
}