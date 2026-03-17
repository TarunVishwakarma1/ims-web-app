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