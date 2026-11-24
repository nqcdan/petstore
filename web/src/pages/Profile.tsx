import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import { useProfile } from '@/api/queries'
import { shopApi } from '@/api/shop'
import { keycloak, MOCK } from '@/auth/keycloak'
import { PageHeader } from '@/components/PageHeader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  fullName: z.string().min(1),
  birthday: z.string().nullable(),
  phone: z.string().regex(/^0\d{9}$/).or(z.literal('')).nullable(),
  address: z.string().nullable(),
})
type Values = z.infer<typeof schema>

export function Profile() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data, isPending } = useProfile()
  const fileRef = useRef<HTMLInputElement>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({ resolver: zodResolver(schema) })
  useEffect(() => {
    if (data) reset({ fullName: data.fullName, birthday: data.birthday ?? '', phone: data.phone ?? '', address: data.address ?? '' })
  }, [data, reset])

  const save = useMutation({
    mutationFn: (v: Values) => shopApi.updateMe({ fullName: v.fullName, birthday: v.birthday || null, phone: v.phone || null, address: v.address || null }),
    onSuccess: (p) => { qc.setQueryData(['me'], p); toast.success(t('common.saved')) },
    onError: (e) => toast.error(e.message),
  })
  const avatar = useMutation({
    mutationFn: shopApi.uploadAvatar,
    onSuccess: (p) => { qc.setQueryData(['me'], p); toast.success(t('common.saved')) },
    onError: (e) => toast.error(e.message),
  })

  return (
    <>
      <PageHeader title={t('profile.title')} />
      <div className="mx-auto grid max-w-4xl gap-6 px-4 py-8 md:grid-cols-[16rem_1fr]">
        {isPending || !data ? <Skeleton className="h-64 md:col-span-2" /> : (
          <>
            <Card><CardContent className="flex flex-col items-center gap-3">
              <Avatar className="size-32">
                <AvatarImage src={`/img/about/${data.avatarUrl}`} alt="" />
                <AvatarFallback>{data.fullName.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png" hidden onChange={(e) => e.target.files?.[0] && avatar.mutate(e.target.files[0])} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>{t('profile.upload')}</Button>
            </CardContent></Card>
            <Card><CardContent>
              <form className="space-y-4" onSubmit={handleSubmit((v) => save.mutate(v))} noValidate>
                <div className="space-y-1.5"><Label>{t('profile.email')}</Label><Input readOnly value={data.email} /></div>
                <div className="space-y-1.5"><Label htmlFor="fullName">{t('profile.fullName')}</Label><Input id="fullName" {...register('fullName')} />
                  {errors.fullName && <p className="text-xs text-destructive">{t('profile.required')}</p>}</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5"><Label htmlFor="birthday">{t('profile.birthday')}</Label><Input id="birthday" type="date" {...register('birthday')} /></div>
                  <div className="space-y-1.5"><Label htmlFor="phone">{t('profile.phone')}</Label><Input id="phone" inputMode="numeric" maxLength={10} {...register('phone')} />
                    {errors.phone && <p className="text-xs text-destructive">{t('profile.phoneInvalid')}</p>}</div>
                </div>
                <div className="space-y-1.5"><Label htmlFor="address">{t('profile.address')}</Label><Input id="address" {...register('address')} /></div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={save.isPending}>{t('common.save')}</Button>
                  {/* Password is owned by Keycloak now; the old /updatePassword + mail-token flow is gone. */}
                  {!MOCK && <Button type="button" variant="outline" onClick={() => void keycloak.accountManagement()}>{t('profile.changePassword')}</Button>}
                </div>
              </form>
            </CardContent></Card>
          </>
        )}
      </div>
    </>
  )
}
