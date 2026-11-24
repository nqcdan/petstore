import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { Toaster } from '@/components/ui/sonner'
import AdminRoutes from '@/admin/AdminRoutes'
import '@/admin/admin-theme.css'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 15_000 } } })

// Entry of the admin-only bundle (VITE_APP=admin): no storefront pages, no cart.
export function AdminApp() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <RequireAuth admin>
              <AdminRoutes />
            </RequireAuth>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
