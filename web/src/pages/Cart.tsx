import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCart } from '@/cart/context'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatVnd, imgUrl } from '@/lib/format'

export function Cart() {
  const { t } = useTranslation()
  const { lines, total, setQuantity, remove, clear } = useCart()

  return (
    <>
      <PageHeader title={t('cart.title')} />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <ShoppingBag className="size-12 text-muted-foreground" />
            <p className="text-lg">{t('cart.empty')}</p>
            <Button asChild><Link to="/shop/products">{t('cart.continue')}</Link></Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
            <div className="space-y-3">
              {lines.map(({ kind, item, quantity }) => (
                <Card key={`${kind}-${item.id}`} data-testid="cart-line">
                  <CardContent className="flex items-center gap-4">
                    <img src={imgUrl(item.pic)} alt="" className="size-20 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{formatVnd(item.price)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon-sm" aria-label="-" onClick={() => setQuantity(kind, item.id, quantity - 1)}><Minus /></Button>
                      <span className="w-8 text-center tabular-nums" aria-label={t('cart.quantity')}>{quantity}</span>
                      <Button variant="outline" size="icon-sm" aria-label="+" onClick={() => setQuantity(kind, item.id, quantity + 1)}><Plus /></Button>
                    </div>
                    <p className="hidden w-32 text-right font-semibold sm:block">{formatVnd(item.price * quantity)}</p>
                    <Button variant="ghost" size="icon-sm" aria-label={t('cart.remove')} onClick={() => remove(kind, item.id)}><Trash2 /></Button>
                  </CardContent>
                </Card>
              ))}
              <Button variant="ghost" size="sm" onClick={clear}>{t('cart.clear')}</Button>
            </div>
            <Card className="h-fit">
              <CardContent className="space-y-4">
                <h2 className="font-semibold">{t('cart.summary')}</h2>
                <div className="flex justify-between text-lg"><span>{t('cart.total')}</span><span className="font-semibold text-primary">{formatVnd(total)}</span></div>
                <Button asChild className="w-full" size="lg"><Link to="/checkout">{t('cart.checkout')}</Link></Button>
                <Button asChild variant="outline" className="w-full"><Link to="/shop/products">{t('cart.continue')}</Link></Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  )
}
