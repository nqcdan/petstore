import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useMe } from '@/api/queries'
import { shopApi } from '@/api/shop'
import { useCart } from '@/cart/context'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatVnd } from '@/lib/format'

export function Checkout() {
  const { t } = useTranslation()
  const { lines, total, clear } = useCart()
  const { data: me } = useMe()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [method, setMethod] = useState<'COD' | 'ATM' | ''>('')
  const [note, setNote] = useState('')

  const place = useMutation({
    // The API has no payment method field yet, so it travels in the order note.
    mutationFn: () => shopApi.createOrder({
      items: lines.map((l) => ({ type: l.kind === 'foods' ? 'FOOD' : 'PRODUCT', id: l.item.id, quantity: l.quantity })),
      note: [`[${method}]`, note].filter(Boolean).join(' '),
    }),
    onSuccess: (order) => {
      clear()
      void qc.invalidateQueries({ queryKey: ['orders'] })
      toast.success(t('checkout.success'))
      navigate(`/orders/${order.code}`)
    },
    onError: (e) => toast.error(e.message),
  })

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-24 text-center">
        <p>{t('checkout.empty')}</p>
        <Button asChild><Link to="/shop/products">{t('cart.continue')}</Link></Button>
      </div>
    )
  }

  const field = (label: string, value?: string | null) => (
    <div className="space-y-1.5"><Label>{label}</Label><Input readOnly value={value ?? ''} /></div>
  )

  return (
    <>
      <PageHeader title={t('checkout.title')} sub={me?.name ? t('checkout.greeting', { name: me.name }) : undefined} />
      <form className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_24rem]"
        onSubmit={(e) => { e.preventDefault(); if (!method) return toast.error(t('checkout.chooseMethod')); place.mutate() }}>
        <Card>
          <CardContent className="space-y-4">
            <h2 className="font-semibold">{t('checkout.info')}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field(t('checkout.fullName'), me?.name)}
              {field(t('checkout.email'), me?.email)}
            </div>
            <Button asChild variant="link" className="h-auto p-0"><Link to="/profile">{t('checkout.updateProfile')}</Link></Button>
            <div className="space-y-1.5">
              <Label htmlFor="note">{t('checkout.note')}</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t('checkout.notePlaceholder')} />
            </div>
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardContent className="space-y-4">
            <h2 className="font-semibold">{t('checkout.yourOrder')}</h2>
            <ul className="space-y-2 text-sm">
              {lines.map((l) => (
                <li key={`${l.kind}-${l.item.id}`} className="flex justify-between gap-3">
                  <span className="line-clamp-1">{l.item.name} × {l.quantity}</span>
                  <span className="shrink-0">{formatVnd(l.item.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-3 text-lg font-semibold"><span>{t('checkout.total')}</span><span className="text-primary">{formatVnd(total)}</span></div>
            <div className="space-y-2">
              <Label>{t('checkout.method')}</Label>
              <RadioGroup value={method} onValueChange={(v) => setMethod(v as 'COD' | 'ATM')}>
                {(['COD', 'ATM'] as const).map((m) => (
                  <Label key={m} htmlFor={`pay-${m}`} className="flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal">
                    <RadioGroupItem value={m} id={`pay-${m}`} /> {t(`checkout.${m.toLowerCase()}`)}
                  </Label>
                ))}
              </RadioGroup>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={place.isPending}>{t('checkout.place')}</Button>
          </CardContent>
        </Card>
      </form>
    </>
  )
}
