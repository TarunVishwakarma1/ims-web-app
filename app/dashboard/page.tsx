import { Button } from "@/components/ui/button";
import { logoutUser } from "../actions/auth";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { mockInventoryData } from "./data";
import { PackageSearch, LogOut } from "lucide-react";

export default async function HomePage() {
    return (
        <div className="flex-1 w-full flex flex-col min-h-screen bg-muted/10">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur shadow-sm">
                <div className="flex items-center gap-2 font-bold tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <PackageSearch className="h-5 w-5" />
                    </div>
                    <span className="text-xl">Inventory</span>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <form action={logoutUser}>
                        <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </form>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 space-y-8 p-8 md:p-12 w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Products</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Manage your inventory, pricing, and stock levels. Real-time updates and seamless sorting to keep your commerce running smoothly.
                    </p>
                </div>

                {/* The beautiful Datatable */}
                <DataTable columns={columns} data={mockInventoryData} />
            </main>
        </div>
    );
}