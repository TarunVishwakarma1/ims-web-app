import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton"
import React from "react"

export interface GenericSkeletonProps {
  /**
   * Type of skeleton layout to render.
   * - "table": A comprehensive data table (reuses DataTableSkeleton)
   * - "stats": KPI cards typically placed at the top of a dashboard
   * - "card-grid": A masonry or uniform grid of generic cards
   * - "list": A vertical stack of list items (e.g. recent activity, customers)
   * - "form": Form input field placeholders
   * - "card": A single detailed card
   */
  variant?: "table" | "stats" | "card-grid" | "list" | "form" | "card"
  
  /** Number of repeated items to render (rows, cards, or list items) */
  count?: number
  
  /** (Table only) Number of columns to show */
  columnCount?: number
}

export function GenericSkeleton({ 
  variant = "card", 
  count = 4,
  columnCount = 5 
}: Readonly<GenericSkeletonProps>) {
  
  switch (variant) {
    case "table":
      return <DataTableSkeleton columnCount={columnCount} rowCount={count} />
      
    case "stats":
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 w-full">
          {Array.from({ length: Math.max(1, count) }).map((_, i) => (
            <Card key={i + "_stat"}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px] mb-2" />
                <Skeleton className="h-4 w-[150px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
      
    case "card-grid":
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full">
           {Array.from({ length: Math.max(1, count) }).map((_, i) => (
             <Card key={i + "_cardgrid"} className="overflow-hidden">
               <Skeleton className="h-32 w-full rounded-none" />
               <CardContent className="p-4 space-y-3">
                 <Skeleton className="h-5 w-2/3" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-4/5" />
               </CardContent>
             </Card>
           ))}
        </div>
      )

    case "list":
      return (
        <div className="space-y-4 w-full">
           {Array.from({ length: Math.max(1, count) }).map((_, i) => (
             <div key={i + "_list"} className="flex flex-row items-center gap-4 border-b border-muted-foreground/10 pb-4">
               <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
               <div className="space-y-2 w-full">
                 <Skeleton className="h-4 w-[250px] max-w-full" />
                 <Skeleton className="h-4 w-[200px] max-w-[80%]" />
               </div>
             </div>
           ))}
        </div>
      )

    case "form":
      return (
        <div className="space-y-6 w-full max-w-2xl">
           {Array.from({ length: Math.max(1, count) }).map((_, i) => (
             <div key={i + "_form"} className="space-y-2">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-10 w-full rounded-md" />
             </div>
           ))}
           <Skeleton className="h-10 w-[120px] rounded-md mt-4" />
        </div>
      )
      
    case "card":
    default:
      return (
        <Card className="w-full">
          <CardHeader>
             <Skeleton className="h-6 w-1/3" />
             <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
             <Skeleton className="h-4 w-full" />
             <Skeleton className="h-4 w-5/6" />
             <Skeleton className="h-4 w-4/6" />
             <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      )
  }
}
