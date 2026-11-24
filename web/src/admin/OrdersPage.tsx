import type { ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAdminOrder, useAdminOrders, useSetOrderState } from '@/api/queries'
import type { Order, OrderState } from '@/api/types'
import { StateBadge } from '@/components/StateBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatVnd } from '@/lib/format'
import { DataTable } from './DataTable'

const STATES: OrderState[] = ['DUE', 'PAID', 'CANCEL']

function OrderDialog({ id, onClose }: { id: number; onClose: () => void }) {
  const { t } = useTranslation()
  const { data } = useAdminOrder(id)
  const setState = useSetOrderState()
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('history.detail')} {data?.code}</DialogTitle>
          <DialogDescription>{data && `${data.customerName} · ${formatDate(data.transactionDate)} · ${data.paymentMethod}`}</DialogDescription>
        </DialogHeader>
        {!data ? <Skeleton className="h-40" /> : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Label htmlFor="state-select">{t('admin.changeState')}</Label>
              <Select value={data.state} onValueChange={(state) => setState.mutate({ id, state: state as OrderState }, {
                onSuccess: () => toast.success(t('admin.stateChanged')), onError: (e) => toast.error(e.message),
              })}>
                <SelectTrigger id="state-select" className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{t(`state.${s}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>{t('history.item')}</TableHead><TableHead className="text-right">{t('history.quantity')}</TableHead><TableHead className="text-right">{t('history.total')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.items?.map((it) => <TableRow key={it.id}><TableCell>{it.name}</TableCell><TableCell className="text-right">{it.quantity}</TableCell><TableCell className="text-right">{formatVnd(it.total)}</TableCell></TableRow>)}
                  <TableRow><TableCell colSpan={2} className="text-right font-semibold">{t('history.total')}</TableCell><TableCell className="text-right font-semibold">{formatVnd(data.total)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
            {data.note && <p className="text-sm text-muted-foreground">{t('history.note')}: {data.note}</p>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function OrdersPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') ?? 0)
  const q = params.get('q') ?? ''
  const state = (params.get('state') ?? undefined) as OrderState | undefined
  const { data, isPending } = useAdminOrders({ page, size: 10, q, state })
  const [openId, setOpenId] = useState<number | null>(null)

  const patch = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    setParams(p)
  }

  const columns: ColumnDef<Order>[] = [
    { accessorKey: 'code', header: t('admin.code'), cell: ({ row }) => <span className="font-mono text-xs">{row.original.code}</span> },
    { accessorKey: 'customerName', header: t('admin.customer') },
    { accessorKey: 'transactionDate', header: t('admin.date'), cell: ({ row }) => formatDate(row.original.transactionDate) },
    { accessorKey: 'total', header: t('admin.total'), cell: ({ row }) => <span className="tabular-nums">{formatVnd(row.original.total)}</span> },
    { accessorKey: 'state', header: t('admin.state'), cell: ({ row }) => <StateBadge state={row.original.state} /> },
    { id: 'actions', header: () => <span className="sr-only">{t('common.actions')}</span>, cell: ({ row }) => (
      <div className="flex justify-end"><Button variant="ghost" size="icon-sm" aria-label={t('common.view')} onClick={() => setOpenId(row.original.id)}><Eye /></Button></div>
    ) },
  ]

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.orders')}</h1>
      <DataTable columns={columns} data={data} loading={isPending} page={page}
        onPageChange={(p) => patch({ page: p ? String(p) : null })}
        search={q} onSearch={(v) => patch({ q: v || null, page: null })}
        toolbar={
          <Select value={state ?? 'all'} onValueChange={(v) => patch({ state: v === 'all' ? null : v, page: null })}>
            <SelectTrigger className="w-60" aria-label={t('admin.filterState')}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {STATES.map((s) => <SelectItem key={s} value={s}>{t(`state.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        } />
      {openId !== null && <OrderDialog id={openId} onClose={() => setOpenId(null)} />}
    </>
  )
}
