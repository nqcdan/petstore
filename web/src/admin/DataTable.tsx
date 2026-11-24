import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table'
import { Search } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Page } from '@/api/types'
import { Pager } from '@/components/Pager'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Props<T> {
  columns: ColumnDef<T>[]
  data?: Page<T>
  loading: boolean
  page: number // zero based
  onPageChange: (page: number) => void
  search?: string
  onSearch?: (q: string) => void
  toolbar?: ReactNode
}

// shadcn data-table recipe, with server-side pagination and a debounced search box.
export function DataTable<T>({ columns, data, loading, page, onPageChange, search, onSearch, toolbar }: Props<T>) {
  const { t } = useTranslation()
  const [text, setText] = useState(search ?? '')
  useEffect(() => {
    if (!onSearch || text === (search ?? '')) return
    const id = setTimeout(() => onSearch(text), 300)
    return () => clearTimeout(id)
  }, [text, search, onSearch])

  // TanStack Table is not memoizable by the React compiler; fine here, rows are plain data.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages ?? 1,
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {onSearch ? (
          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('common.search')} className="w-64 pl-8" aria-label={t('common.search')} />
          </div>
        ) : <span />}
        <div className="flex items-center gap-2">{toolbar}</div>
      </div>
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}><TableCell colSpan={columns.length}><Skeleton className="h-8" /></TableCell></TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">{t('common.empty')}</TableCell></TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((c) => <TableCell key={c.id}>{flexRender(c.column.columnDef.cell, c.getContext())}</TableCell>)}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Pager page={page + 1} totalPages={data?.totalPages ?? 1} onChange={(p) => onPageChange(p - 1)} />
    </div>
  )
}
