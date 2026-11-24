import { useTranslation } from 'react-i18next'
import type { OrderState } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const style: Record<OrderState, string> = {
  PAID: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  DUE: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  CANCEL: 'bg-red-500/15 text-red-700 dark:text-red-400',
}

export function StateBadge({ state }: { state: OrderState | null }) {
  const { t } = useTranslation()
  if (!state) return <span className="text-muted-foreground">-</span>
  return <Badge variant="outline" className={cn('border-transparent', style[state])}>{t(`state.${state}`)}</Badge>
}
