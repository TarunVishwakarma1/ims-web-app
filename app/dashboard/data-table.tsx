"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal, Trash2 } from "lucide-react"
import { ShortcutKey } from "@/components/ui/shortcut-key"
import { useShortcut } from "@/hooks/use-shortcut"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data: initialData,
}: Readonly<DataTableProps<TData, TValue>>) {
  const [data, setData] = React.useState<TData[]>(initialData)

  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta: {
      removeRow: (rowIndex: number) => {
        setData(prev => prev.filter((_, index) => index !== rowIndex))
        // Deselect if it was selected
        setRowSelection(prev => {
          const updated = { ...prev }
          delete (updated as any)[rowIndex]
          return updated
        })
      }
    }
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelected = selectedRows.length > 0

  const handleDelete = React.useCallback(() => {
    if (!hasSelected) return
    const itemsToDelete = selectedRows.map(r => r.original)
    console.log("Deleting rows:", itemsToDelete)
    
    setData(prev => prev.filter(item => !itemsToDelete.includes(item)))
    setRowSelection({})
  }, [hasSelected, selectedRows])

  useShortcut(["Backspace", "Delete"], handleDelete, hasSelected)

  return (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2 w-full flex-wrap gap-y-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter products..."
              value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="pl-8 h-9 shadow-sm bg-background border-muted-foreground/20 focus-visible:ring-primary/20 transition-all rounded-full"
            />
          </div>
          {hasSelected && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="h-9 px-3 lg:px-4 shrink-0 transition-all animate-in fade-in"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedRows.length})
              <ShortcutKey 
                keys={["Delete"]} 
                className="bg-destructive-foreground/20 text-destructive-foreground hover:bg-destructive-foreground/20 dark:bg-black/20 dark:text-white border-destructive-foreground/30" 
              />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 rounded-full shadow-sm ml-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View Options
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    column.accessorFn !== undefined && column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="rounded-xl border border-muted-foreground/10 bg-background/50 shadow-sm backdrop-blur-[2px] overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-b-muted-foreground/10">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan} className="py-4">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="group border-b-muted-foreground/10 transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3 px-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-44 text-center"
                  >
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="h-10 w-10 mb-4 opacity-20" />
                      <p className="text-lg font-medium">No results found.</p>
                      <p className="text-sm opacity-60">Try adjusting your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <DataTablePagination table={table} />
    </div>
  )
}
