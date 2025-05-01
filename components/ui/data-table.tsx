import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ReactNode } from "react"

interface Column<T> {
  key: string
  header: ReactNode
  cell: (item: T, index: number) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string | number
  emptyState?: ReactNode
  isLoading?: boolean
  loadingState?: ReactNode
  className?: string
  rowClassName?: (item: T, index: number) => string
}

/**
 * Generische Tabellenkomponente für Datenansichten
 * Ermöglicht die einfache Darstellung von Daten in Tabellenform
 */
export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyState,
  isLoading = false,
  loadingState,
  className,
  rowClassName,
}: DataTableProps<T>) {
  if (isLoading && loadingState) {
    return loadingState
  }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg overflow-hidden ${className}`}>
      <Table>
        <TableHeader className="bg-gray-800">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.key} className={`text-gray-300 ${column.className}`}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-gray-400">
                {emptyState || "Keine Daten gefunden."}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, index) => (
              <TableRow
                key={keyExtractor(item)}
                className={`hover:bg-gray-800/50 border-gray-800 ${rowClassName ? rowClassName(item, index) : ""}`}
              >
                {columns.map((column) => (
                  <TableCell key={`${keyExtractor(item)}-${column.key}`} className={column.className}>
                    {column.cell(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
