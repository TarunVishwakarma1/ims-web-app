import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"

export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 10,
  showToolbar = true,
}: Readonly<{
  columnCount?: number
  rowCount?: number
  showToolbar?: boolean
}>) {
  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toolbar Skeleton */}
      {showToolbar && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative w-full max-w-sm">
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Skeleton className="h-9 w-[120px] rounded-full" />
          </div>
        </div>
      )}

      {/* Table Skeleton */}
      <Card className="rounded-xl border border-muted-foreground/10 bg-background/50 shadow-sm backdrop-blur-[2px] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b-muted-foreground/10">
                {Array.from({ length: columnCount }).map((_, i) => (
                  <TableHead key={i+"_header"} className="py-4">
                    <Skeleton className="h-6 w-full max-w-[120px]" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rowCount }).map((_, i) => (
                <TableRow
                  key={i+"_row"}
                  className="border-b-muted-foreground/10 transition-colors"
                >
                  {Array.from({ length: columnCount }).map((_, j) => (
                    <TableCell key={j+"_cell"} className="py-3 px-4">
                      {/* Randomize width slightly for natural look */}
                      <Skeleton 
                        className={`h-5 w-full ${
                          j === 0 ? "max-w-[180px]" : j === 1 ? "max-w-[80px]" : "max-w-[100px]"
                        }`} 
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      {/* Pagination Placeholder */}
      <div className="flex items-center justify-between px-2 flex-wrap gap-4">
        <Skeleton className="h-4 w-[150px]" />
        <div className="flex items-center space-x-6 lg:space-x-8">
           <Skeleton className="h-8 w-[100px]" />
           <Skeleton className="h-8 w-[200px]" />
        </div>
      </div>
    </div>
  )
}
