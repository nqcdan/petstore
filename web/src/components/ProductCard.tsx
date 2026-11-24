import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { CatalogItem, CatalogKind } from '@/api/types'
import { useCart } from '@/cart/context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatVnd, imgUrl } from '@/lib/format'

export function ProductCard({ kind, item, onOpen }: { kind: CatalogKind; item: CatalogItem; onOpen?: (i: CatalogItem) => void }) {
  const { t } = useTranslation()
  const { add } = useCart()
  return (
    <Card className="group overflow-hidden pt-0" data-testid="product-card">
      <button type="button" onClick={() => onOpen?.(item)} className="relative block aspect-square overflow-hidden bg-muted text-left">
        <img src={imgUrl(item.pic)} alt={item.name} loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
        {item.type && <Badge variant="secondary" className="absolute left-2 top-2">{item.type}</Badge>}
      </button>
      <CardContent className="flex flex-1 flex-col gap-3">
        <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5">{item.name}</h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="font-semibold text-primary">{formatVnd(item.price)}</span>
          <Button size="sm" onClick={() => { add(kind, item); toast.success(t('shop.added', { name: item.name })) }}>
            <Plus /> <span className="sr-only sm:not-sr-only">{t('shop.add')}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
