"use client"

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Column<T> {
  accessorKey: string
  header: string
  cell?: (info: { row: { original: T } }) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchKey?: string
  placeholder?: string
}

export function DataTable<T>({ data, columns, searchKey, placeholder }: DataTableProps<T>) {
  const [searchValue, setSearchValue] = React.useState("")
  const [currentPage, setCurrentPage] = React.useState(0)
  const pageSize = 10

  // Einfache Filterung
  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchValue) return data
    return data.filter((item) => {
      const value = (item as any)[searchKey]
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchValue.toLowerCase())
      }
      return false
    })
  }, [data, searchKey, searchValue])

  // Einfache Paginierung
  const paginatedData = React.useMemo(() => {
    const start = currentPage * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage])

  const pageCount = Math.ceil(filteredData.length / pageSize)

  return (
    <div>
      {searchKey && (
        <div className="flex items-center py-4">
          <Input
            placeholder={placeholder || "Suchen..."}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell key={column.accessorKey}>
                      {column.cell ? column.cell({ row: { original: row } }) : (row as any)[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Keine Ergebnisse.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {pageCount > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            appearance="outline"
            buttonSize="sm"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            Zurück
          </Button>
          <Button
            appearance="outline"
            buttonSize="sm"
            onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
            disabled={currentPage === pageCount - 1}
          >
            Weiter
          </Button>
        </div>
      )}
    </div>
  )
}
