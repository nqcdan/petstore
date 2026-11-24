import { CircleDollarSign, Package, ReceiptText, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { useAdminStats } from '@/api/queries'
import type { OrderState } from '@/api/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { formatVnd } from '@/lib/format'

const stateColor: Record<OrderState, string> = { PAID: 'var(--chart-3)', DUE: 'var(--chart-4)', CANCEL: 'var(--destructive)' }
const compact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact' }).format(n)

export function Dashboard() {
  const { t } = useTranslation()
  const { data, isPending, isError } = useAdminStats()

  if (isError) return <p>{t('common.error')}</p>
  if (isPending) return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>

  const kpis = [
    { label: t('admin.kpi.revenue'), value: formatVnd(data.totals.revenue), icon: CircleDollarSign },
    { label: t('admin.kpi.orders'), value: data.totals.orders, icon: ReceiptText },
    { label: t('admin.kpi.customers'), value: data.totals.customers, icon: Users },
    { label: t('admin.kpi.items'), value: data.totals.items, icon: Package },
  ]
  const revenueConfig = { revenue: { label: t('admin.kpi.revenue'), color: 'var(--chart-1)' } } satisfies ChartConfig
  const stateConfig = Object.fromEntries((Object.keys(stateColor) as OrderState[]).map((s) => [s, { label: t(`state.${s}`), color: stateColor[s] }])) satisfies ChartConfig
  const topConfig = { revenue: { label: t('admin.kpi.revenue'), color: 'var(--chart-2)' } } satisfies ChartConfig

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t('admin.dashboard')}</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} data-testid="kpi">
            <CardHeader className="flex items-center justify-between">
              <CardDescription>{k.label}</CardDescription>
              <k.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-semibold tabular-nums">{k.value}</p></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>{t('admin.revenue30')}</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={revenueConfig} className="h-64 w-full">
              <LineChart data={data.revenueByDay} margin={{ left: 4, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tickFormatter={(d: string) => d.slice(5)} />
                <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={compact} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => formatVnd(Number(v))} />} />
                <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('admin.ordersByState')}</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={stateConfig} className="mx-auto h-64 w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="state" hideLabel />} />
                <Pie data={data.ordersByState} dataKey="count" nameKey="state" innerRadius={50} strokeWidth={2}>
                  {data.ordersByState.map((s) => <Cell key={s.state} fill={stateColor[s.state]} />)}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="state" />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{t('admin.topItems')}</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={topConfig} className="h-64 w-full">
            <BarChart data={data.topItems.map((i) => ({ ...i, short: i.name.length > 28 ? `${i.name.slice(0, 28)}…` : i.name }))} layout="vertical" margin={{ left: 8, right: 12 }}>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="short" type="category" tickLine={false} axisLine={false} width={190} />
              <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={compact} />
              <ChartTooltip content={<ChartTooltipContent formatter={(v, _n, item) => `${formatVnd(Number(v))} · ${t('admin.sold')} ${(item.payload as { quantity: number }).quantity}`} hideLabel />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </>
  )
}
