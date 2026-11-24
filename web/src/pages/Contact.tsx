import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { MapPin, Phone } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { shopApi } from '@/api/shop'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({ name: z.string().min(1, 'required'), email: z.email('email'), message: z.string().min(1, 'required') })
type Values = z.infer<typeof schema>

export function Contact() {
  const { t } = useTranslation()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) })
  const send = useMutation({
    mutationFn: shopApi.sendContact,
    onSuccess: () => { toast.success(t('contact.sent')); reset() },
    onError: (e) => toast.error(e.message),
  })
  const err = (m?: string) => m && <p className="text-xs text-destructive">{m === 'email' ? t('contact.emailInvalid') : t('contact.required')}</p>

  return (
    <>
      <PageHeader title={t('contact.title')} sub={t('contact.sub')} />
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[20rem_1fr]">
        <div className="space-y-4">
          <Card><CardContent className="space-y-2">
            <h2 className="font-semibold">{t('contact.branch')}</h2>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" /> {t('contact.address')}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="size-4" /> {t('contact.hotline')}: +84 928 494 156</p>
          </CardContent></Card>
          <img src="/img/banner/t.jpg" alt="" className="hidden rounded-xl object-cover md:block" />
        </div>
        <Card>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit((v) => send.mutate(v))} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="name">{t('contact.name')}</Label><Input id="name" {...register('name')} />{err(errors.name?.message)}</div>
                <div className="space-y-1.5"><Label htmlFor="email">{t('contact.email')}</Label><Input id="email" type="email" {...register('email')} />{err(errors.email?.message)}</div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="message">{t('contact.message')}</Label><Textarea id="message" rows={6} {...register('message')} />{err(errors.message?.message)}</div>
              <Button type="submit" disabled={send.isPending}>{t('contact.send')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
