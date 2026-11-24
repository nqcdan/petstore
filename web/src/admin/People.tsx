import type { ColumnDef } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useAdminCustomers, useAdminEmployees } from '@/api/queries'
import type { Customer, Employee } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import { DataTable } from './DataTable'

function usePaging() {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? 0)
  const q = params.get('q') ?? ''
  const patch = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p)
  }
  return { page, q, onPageChange: (p: number) => patch({ page: p ? String(p) : null }), onSearch: (v: string) => patch({ q: v || null, page: null }) }
}

export function CustomersPage() {
  const { t } = useTranslation()
  const { page, q, onPageChange, onSearch } = usePaging()
  const { data, isPending } = useAdminCustomers({ page, size: 10, q })
  const columns: ColumnDef<Customer>[] = [
    { accessorKey: 'fullName', header: t('admin.fullName') },
    { accessorKey: 'username', header: t('admin.username') },
    { accessorKey: 'email', header: t('admin.email') },
    { accessorKey: 'phone', header: t('admin.phone') },
    { accessorKey: 'orderCount', header: t('admin.orderCount') },
    { accessorKey: 'createdAt', header: t('admin.date'), cell: ({ row }) => formatDate(row.original.createdAt) },
  ]
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.customers')}</h1>
      <DataTable columns={columns} data={data} loading={isPending} page={page} onPageChange={onPageChange} search={q} onSearch={onSearch} />
    </>
  )
}

export function EmployeesPage() {
  const { t } = useTranslation()
  const { page, q, onPageChange, onSearch } = usePaging()
  const { data, isPending } = useAdminEmployees({ page, size: 10, q })
  const columns: ColumnDef<Employee>[] = [
    { accessorKey: 'fullName', header: t('admin.fullName') },
    { accessorKey: 'username', header: t('admin.username') },
    { accessorKey: 'email', header: t('admin.email') },
    { accessorKey: 'phone', header: t('admin.phone') },
    { accessorKey: 'role', header: t('admin.role'), cell: ({ row }) => <Badge variant={row.original.role === 'Admin' ? 'default' : 'secondary'}>{row.original.role}</Badge> },
  ]
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.employees')}</h1>
      <DataTable columns={columns} data={data} loading={isPending} page={page} onPageChange={onPageChange} search={q} onSearch={onSearch} />
    </>
  )
}
