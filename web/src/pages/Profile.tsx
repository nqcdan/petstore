import { useTranslation } from 'react-i18next'
import { useMe } from '@/api/queries'
import { keycloak, MOCK } from '@/auth/keycloak'
import { PageHeader } from '@/components/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// The REST API only exposes the identity from the token (GET /me); profile fields live in Keycloak.
export function Profile() {
  const { t } = useTranslation()
  const { data, isPending } = useMe()
  const rows = data && [
    [t('profile.fullName'), data.name],
    [t('profile.username'), data.username],
    [t('profile.email'), data.email],
  ]
  return (
    <>
      <PageHeader title={t('profile.title')} />
      <div className="mx-auto max-w-2xl px-4 py-8">
        {isPending || !data ? <Skeleton className="h-48" /> : (
          <Card><CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16"><AvatarFallback className="text-xl">{(data.name ?? data.username).slice(0, 1)}</AvatarFallback></Avatar>
              <div className="flex flex-wrap gap-2">{data.roles.map((r) => <Badge key={r} variant={r === 'admin' ? 'default' : 'secondary'}>{r}</Badge>)}</div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
              {rows?.map(([k, v]) => (<div key={k} className="contents"><dt className="text-muted-foreground">{k}</dt><dd>{v ?? '-'}</dd></div>))}
            </dl>
            {!MOCK && <Button variant="outline" onClick={() => void keycloak.accountManagement()}>{t('profile.manage')}</Button>}
          </CardContent></Card>
        )}
      </div>
    </>
  )
}
