import AppSidebar from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logoutUser } from "../actions/auth";
import React from "react";

import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";

/**
 * Layout component that wraps page content with a sidebar and inset area.
 *
 * @param children - Content to render inside the layout's main inset area (to the right of the sidebar)
 * @returns A React element that provides a SidebarProvider with a Sidebar (content and footer) and a SidebarInset containing a header with a SidebarTrigger and the provided children
 */
export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur shadow-sm transition-[width,auto]">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        
                        {/* Breadcrumbs */}
                        <DynamicBreadcrumbs />
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

                <main className="flex-1 w-full flex flex-col min-h-screen">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}