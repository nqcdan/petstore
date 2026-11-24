import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { CartProvider } from '@/cart/CartProvider'
import { SiteLayout } from '@/components/layout/SiteLayout'
import { Toaster } from '@/components/ui/sonner'
import { About } from '@/pages/About'
import { Blog, BlogDetail } from '@/pages/Blog'
import { Cart } from '@/pages/Cart'
import { Checkout } from '@/pages/Checkout'
import { Contact } from '@/pages/Contact'
import { Home } from '@/pages/Home'
import { OrderDetail, OrderHistory } from '@/pages/Orders'
import { NotFound } from '@/pages/NotFound'
import { Profile } from '@/pages/Profile'
import { Shop } from '@/pages/Shop'

const AdminRoutes = lazy(() => import('@/admin/AdminRoutes'))

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 15_000 } } })

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                <Route
                  path="/admin/*"
                  element={
                    <RequireAuth admin>
                      <Suspense fallback={null}>
                        <AdminRoutes />
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route element={<SiteLayout />}>
                  <Route index element={<Home />} />
                  <Route path="shop/:kind" element={<Shop />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<RequireAuth><Checkout /></RequireAuth>} />
                  <Route path="orders" element={<RequireAuth><OrderHistory /></RequireAuth>} />
                  <Route path="orders/:id" element={<RequireAuth><OrderDetail /></RequireAuth>} />
                  <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="about" element={<About />} />
                  <Route path="blog" element={<Blog />} />
                  <Route path="blog/:slug" element={<BlogDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </BrowserRouter>
            <Toaster richColors position="top-right" />
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
