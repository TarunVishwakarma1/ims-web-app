import { DataTable } from "./data-table";
import { columns } from "./columns";
import { mockInventoryData } from "./data";
import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";

// Mock async function to simulate an API request (e.g. database query)
// In the future you will replace this with your actual DB call or fetch()
async function getInventoryData() {
    await new Promise((resolve) => setTimeout(resolve, 2500)); // Simulating 2.5s network delay
    return mockInventoryData;
}

// Sub-component specifically for fetching and rendering the data table
async function InventoryTableFetcher() {
    const data = await getInventoryData();
    
    // Fallback if data array is intentionally empty
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border rounded-xl bg-background/50 border-muted-foreground/10 border-dashed">
                <p className="text-muted-foreground text-lg font-medium">No data found</p>
            </div>
        )
    }

    return <DataTable columns={columns} data={data} liveEndpoint="/api/live/ims/update/product" />;
}

export default async function HomePage() {
    return (
        <div className="flex-1 w-full flex flex-col min-h-screen bg-muted/10">
            {/* Main Content Area */}
            <main className="flex-1 space-y-8 p-8 md:p-12 w-full">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">Products</h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Manage your inventory, pricing, and stock levels. Real-time updates and seamless sorting to keep your commerce running smoothly.
                    </p>
                </div>

                {/* The beautiful Datatable wrapped in Suspense */}
                <Suspense fallback={<DataTableSkeleton columnCount={8} rowCount={8} showToolbar={true} />}>
                    <InventoryTableFetcher />
                </Suspense>
            </main>
        </div>
    );
}