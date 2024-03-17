import * as React from "react"
import type { DataTableSearchableColumn } from "@/types"
import type { Table } from "@tanstack/react-table"

import { Input } from "@/components/ui/input"

type FilterToolbarProps<TData> = {
  table: Table<TData>
  searchableColumns: DataTableSearchableColumn<TData>[]
}

function FilterToolbar<TData>(
  { table, searchableColumns }: FilterToolbarProps<TData>
) {
  return (
    <>
      {searchableColumns.length > 0 &&
        searchableColumns.map(
          (column) =>
            table.getColumn(column.id ? String(column.id) : "") && (
              <Input
                key={String(column.id)}
                placeholder={`Filter ${column.placeholder}...`}
                value={
                  (table
                    .getColumn(String(column.id))
                    ?.getFilterValue() as string) ?? ""
                }
                onChange={(event) =>
                  table
                    .getColumn(String(column.id))
                    ?.setFilterValue(event.target.value)
                }
                className="h-8 w-[150px] lg:w-[250px]"
              />
            )
        )}
    </>
  )
}

export default FilterToolbar
