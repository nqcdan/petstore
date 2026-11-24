import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useCatalog } from '@/api/queries'
import type { CatalogItem, CatalogKind, CatalogQuery } from '@/api/types'
import { useCart } from '@/cart/context'
import { PageHeader } from '@/components/PageHeader'
import { Pager } from '@/components/Pager'
import { ProductCard } from '@/components/ProductCard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatVnd, imgUrl } from '@/lib/format'
import { NotFound } from './NotFound'

const PAGE_SIZE = 12

export function Shop() {
  const { kind } = useParams()
  if (kind !== 'products' && kind !== 'foods') return <NotFound />
  return <ShopList key={kind} kind={kind} />
}

function ShopList({ kind }: { kind: CatalogKind }) {
  const { t } = useTranslation()
  const { add } = useCart()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page') ?? 1))
  const sort = (params.get('sort') ?? 'default') as 'default' | NonNullable<CatalogQuery['sort']>
  const q = params.get('q') ?? ''
  const [text, setText] = useState(q)
  const [open, setOpen] = useState<CatalogItem | null>(null)

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next)
  }
  const { data, isPending, isError, refetch } = useCatalog(kind, { page: page - 1, size: PAGE_SIZE, q, sort: sort === 'default' ? undefined : sort })

  return (
    <>
      <PageHeader title={kind === 'products' ? t('shop.titleProducts') : t('shop.titleFoods')}
        sub={data ? t('shop.showing', { count: data.items.length, total: data.totalItems }) : undefined}>
        <div className="flex flex-wrap items-center gap-2">
          <form className="relative" onSubmit={(e) => { e.preventDefault(); update({ q: text || null, page: null }) }}>
            <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={t('common.search')} className="w-56 pl-8" aria-label={t('common.search')} />
          </form>
          <Select value={sort} onValueChange={(v) => update({ sort: v === 'default' ? null : v, page: null })}>
            <SelectTrigger className="w-44" aria-label={t('shop.sortBy')}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t('shop.defaultSort')}</SelectItem>
              <SelectItem value="price,asc">{t('shop.sortBy')}: {t('shop.priceAsc')}</SelectItem>
              <SelectItem value="price,desc">{t('shop.sortBy')}: {t('shop.priceDesc')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {isError ? (
          <div className="py-16 text-center"><p className="mb-3">{t('common.error')}</p><Button onClick={() => void refetch()}>{t('common.retry')}</Button></div>
        ) : isPending ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, n) => <Skeleton key={n} className="aspect-[3/4]" />)}</div>
        ) : data.items.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">{t('shop.none')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.items.map((p) => <ProductCard key={p.id} kind={kind} item={p} onOpen={setOpen} />)}
          </div>
        )}
        {data && <Pager page={page} totalPages={data.totalPages} onChange={(p) => update({ page: p === 1 ? null : String(p) })} />}
      </div>
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{t('shop.details')}</DialogTitle>
                <DialogDescription className="sr-only">{open.name}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <img src={imgUrl(open.imageUrl)} alt={open.name} className="aspect-square w-full rounded-lg object-cover" />
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold">{open.name}</h2>
                  <p className="text-xl font-semibold text-primary">{formatVnd(open.price)}</p>
                  <p className="max-h-48 overflow-y-auto text-sm text-muted-foreground">{open.description}</p>
                  <Button className="mt-auto" onClick={() => { add(kind, open); toast.success(t('shop.added', { name: open.name })); setOpen(null) }}>{t('shop.add')}</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
