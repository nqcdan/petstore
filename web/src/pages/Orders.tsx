import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useMyOrder, useMyOrders } from '@/api/queries'
import { PageHeader } from '@/components/PageHeader'
import { StateBadge } from '@/components/StateBadge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatVnd } from '@/lib/format'

export function OrderHistory() {
  const { t } = useTranslation()
  const { data, isPending } = useMyOrders()
  return (
    <>
      <PageHeader title={t('history.title')} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {isPending ? <Skeleton className="h-48" /> : !data?.length ? (
          <p className="py-16 text-center text-muted-foreground">{t('history.empty')}</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('history.code')}</TableHead><TableHead>{t('history.date')}</TableHead>
                  <TableHead className="text-right">{t('history.total')}</TableHead><TableHead>{t('history.state')}</TableHead><TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.code}</TableCell>
                    <TableCell>{formatDate(o.transactionDate)}</TableCell>
                    <TableCell className="text-right">{formatVnd(o.total)}</TableCell>
                    <TableCell><StateBadge state={o.state} /></TableCell>
                    <TableCell className="text-right"><Button asChild variant="ghost" size="sm"><Link to={`/orders/${o.code}`}>{t('common.view')}</Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  )
}

export function OrderDetail() {
  const { t } = useTranslation()
  const { code } = useParams()
  const { data, isPending, isError } = useMyOrder(code ?? '')
  return (
    <>
      <PageHeader title={t('history.detail')} sub={data?.code} />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <Button asChild variant="ghost" size="sm"><Link to="/orders">← {t('common.back')}</Link></Button>
        {isPending ? <Skeleton className="h-48" /> : isError || !data ? <p>{t('common.error')}</p> : (
          <>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <StateBadge state={data.state} />
              <span>{formatDate(data.transactionDate)}</span>
              <span>{t('history.payment')}: {t(`checkout.${data.paymentMethod.toLowerCase()}`)}</span>
              {data.note && <span className="text-muted-foreground">{t('history.note')}: {data.note}</span>}
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>{t('history.item')}</TableHead><TableHead className="text-right">{t('history.quantity')}</TableHead><TableHead className="text-right">{t('history.total')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.items.map((it) => (
                    <TableRow key={it.name}><TableCell>{it.name}</TableCell><TableCell className="text-right">{it.quantity}</TableCell><TableCell className="text-right">{formatVnd(it.total)}</TableCell></TableRow>
                  ))}
                  <TableRow><TableCell colSpan={2} className="text-right font-semibold">{t('history.total')}</TableCell><TableCell className="text-right font-semibold text-primary">{formatVnd(data.total)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </>
  )
}
