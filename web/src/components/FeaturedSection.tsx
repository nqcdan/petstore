import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCatalog } from '@/api/queries'
import type { CatalogItem, CatalogKind } from '@/api/types'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

// The API has no "featured" flag: take the priciest items and deal them out one type at a time (DOG, CAT, ...).
function mixByType(items: CatalogItem[], count: number): CatalogItem[] {
  const groups = new Map<string, CatalogItem[]>()
  for (const it of items) groups.set(it.type ?? '', [...(groups.get(it.type ?? '') ?? []), it])
  const queues = [...groups.values()]
  const out: CatalogItem[] = []
  while (out.length < count && queues.some((q) => q.length)) {
    for (const q of queues) if (q.length && out.length < count) out.push(q.shift()!)
  }
  return out
}

type Props = { kind: CatalogKind; title: string; sub: string; count: number; className?: string }

export function FeaturedSection({ kind, title, sub, count, className }: Props) {
  const { t } = useTranslation()
  const featured = useCatalog(kind, { size: 12, page: 0, sort: 'price,desc' })
  const items = featured.data ? mixByType(featured.data.items, count) : []
  // 3-column tablet layout hides the items that would leave a half empty last row
  const tabletTrim = count === 8 ? '[&>:nth-child(n+7)]:sm:max-lg:hidden' : count === 4 ? '[&>:nth-child(n+4)]:sm:max-lg:hidden' : ''
  return (
    <section className={`mx-auto max-w-6xl px-4 pb-12 ${className ?? ''}`} data-testid={`featured-${kind}`}>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground">{sub}</p>
        </div>
        <Button asChild variant="ghost"><Link to={`/shop/${kind}`}>{t('home.viewAll')} <ArrowRight /></Link></Button>
      </div>
      <div className={`grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${tabletTrim}`}>
        {featured.isPending
          ? Array.from({ length: count }, (_, n) => <Skeleton key={n} className="aspect-[3/4]" />)
          : items.map((p) => <ProductCard key={p.id} kind={kind} item={p} />)}
      </div>
    </section>
  )
}
