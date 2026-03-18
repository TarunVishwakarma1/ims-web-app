import { Button } from "@/components/ui/button";
import { logoutUser } from "../actions/auth";

export default async function HomePage() {
    return (
        <Button variant='destructive' type="button" onClick={logoutUser}>Logout</Button>
    );
}