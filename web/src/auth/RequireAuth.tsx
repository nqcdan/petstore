import { useEffect, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { DemoAccounts } from '@/components/DemoAccounts'
import { useAuth } from './context'

export function RequireAuth({ admin = false, children }: { admin?: boolean; children: ReactNode }) {
  const { ready, user, isAdmin, login, mock } = useAuth()
  const { t } = useTranslation()

  // Real Keycloak: go straight to the SSO page. Mock mode shows a chooser instead.
  useEffect(() => {
    if (ready && !user && !mock) login()
  }, [ready, user, mock, login])

  if (!ready) return null
  if (!user) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">{t('auth.required')}</h1>
        <DemoAccounts />
        {mock && (
          <div className="flex gap-2">
            <Button onClick={() => login('customer')}>{t('auth.loginCustomer')}</Button>
            <Button variant="outline" onClick={() => login('admin')}>{t('auth.loginAdmin')}</Button>
          </div>
        )}
      </div>
    )
  }
  if (admin && !isAdmin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">{t('auth.forbidden')}</h1>
        <Button asChild><Link to="/">{t('nav.home')}</Link></Button>
      </div>
    )
  }
  return <>{children}</>
}
