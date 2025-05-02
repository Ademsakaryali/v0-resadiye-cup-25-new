import type React from "react"

interface DataTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    cell: (item: T) => React.ReactNode
  }[]
  keyExtractor: (item: T) => string | number
  emptyState?: React.ReactNode
}

export function DataTable<T>({ data, columns, keyExtractor, emptyState }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-4 whitespace-nowrap text-center">
                {emptyState || "Keine Daten vorhanden"}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {columns.map((column) => (
                  <td key={`${keyExtractor(item)}-${column.key}`} className="px-6 py-4 whitespace-nowrap">
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
