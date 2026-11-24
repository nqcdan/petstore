import { createContext, useContext } from 'react'

export interface AuthUser {
  name: string
  email: string
  roles: string[]
}

export type MockRole = 'customer' | 'admin'

export interface AuthState {
  ready: boolean
  user: AuthUser | null
  isAdmin: boolean
  mock: boolean
  login: (mockRole?: MockRole) => void
  logout: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
