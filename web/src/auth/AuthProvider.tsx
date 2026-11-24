import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AuthContext, type AuthState, type AuthUser, type MockRole } from './context'
import { ADMIN_ROLE, MOCK, keycloak } from './keycloak'
import { setTokenSource } from './token'

const MOCK_KEY = 'petstore.mock-user'
const MOCK_USERS: Record<MockRole, AuthUser> = {
  customer: { name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', roles: ['customer'] },
  admin: { name: 'Trần Thị Bích', email: 'bich.tran@example.com', roles: ['customer', ADMIN_ROLE] },
}

function readMock(): AuthUser | null {
  const role = localStorage.getItem(MOCK_KEY) as MockRole | null
  return role ? (MOCK_USERS[role] ?? null) : null
}

// Set at module load so child queries (whose effects run before the provider's) already see it.
if (MOCK) setTokenSource(async () => (localStorage.getItem(MOCK_KEY) ? 'mock-token' : undefined))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(MOCK)
  const [user, setUser] = useState<AuthUser | null>(MOCK ? readMock() : null)
  const started = useRef(false)

  const syncFromKeycloak = useCallback(() => {
    if (!keycloak.authenticated) return setUser(null)
    const t = keycloak.tokenParsed as { name?: string; email?: string; realm_access?: { roles: string[] } } | undefined
    setUser({ name: t?.name ?? '', email: t?.email ?? '', roles: t?.realm_access?.roles ?? [] })
  }, [])

  useEffect(() => {
    if (started.current) return
    started.current = true
    if (MOCK) return
    setTokenSource(async () => {
      if (!keycloak.authenticated) return undefined
      await keycloak.updateToken(30).catch(() => keycloak.login())
      return keycloak.token
    })
    keycloak.onTokenExpired = () => void keycloak.updateToken(30).catch(() => keycloak.login())
    keycloak
      .init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      })
      .then(syncFromKeycloak)
      .catch((e) => console.error('Keycloak init failed', e))
      .finally(() => setReady(true))
  }, [syncFromKeycloak])

  const login = useCallback((mockRole: MockRole = 'customer') => {
    if (MOCK) {
      localStorage.setItem(MOCK_KEY, mockRole)
      setUser(MOCK_USERS[mockRole])
      return
    }
    void keycloak.login({ redirectUri: window.location.href })
  }, [])

  const logout = useCallback(() => {
    if (MOCK) {
      localStorage.removeItem(MOCK_KEY)
      setUser(null)
      return
    }
    void keycloak.logout({ redirectUri: window.location.origin })
  }, [])

  const value = useMemo<AuthState>(
    () => ({ ready, user, isAdmin: !!user?.roles.includes(ADMIN_ROLE), mock: MOCK, login, logout }),
    [ready, user, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
