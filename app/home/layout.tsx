'use client'

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import React from "react";

/**
 * Layout component that wraps page content with a sidebar and inset area.
 *
 * @param children - Content to render inside the layout's main inset area (to the right of the sidebar)
 * @returns A React element that provides a SidebarProvider with a Sidebar (content and footer) and a SidebarInset containing a header with a SidebarTrigger and the provided children
 */
export default function HomeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <SidebarProvider>
            <Sidebar>
                <SidebarContent>
                </SidebarContent>
                <SidebarFooter>
                    Hi
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <header className="flex h-14 items-center gap-2 border-b px-4">
                    <SidebarTrigger />
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    )
}