import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminApp } from '@/AdminApp'
import { resetDb } from '@/mocks/db'
import i18n from '@/i18n'

// The admin-only bundle is selected by VITE_APP=admin, which the modules read once at load: set it before the imports run.
vi.hoisted(() => vi.stubEnv('VITE_APP', 'admin'))

function openAdminSite(path: string) {
  window.history.pushState({}, '', path)
  return render(<AdminApp />)
}

beforeEach(async () => {
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })) as unknown as typeof window.matchMedia
  localStorage.clear()
  resetDb()
  await i18n.changeLanguage('vi')
})
describe('admin site (VITE_APP=admin)', () => {
  it('serves the dashboard at / with PETS Admin branding and root-relative links', async () => {
    localStorage.setItem('petstore.mock-user', 'admin')
    openAdminSite('/')
    expect(await screen.findAllByTestId('kpi')).toHaveLength(4)
    expect(screen.getByText('PETS Admin')).toBeInTheDocument()
    expect(screen.queryByText('PETS Store')).not.toBeInTheDocument()
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/products', '/foods', '/orders', '/customers', '/employees']))
    expect(hrefs.some((h) => h?.startsWith('/admin'))).toBe(false)
  })

  it('serves the other screens without the /admin prefix', async () => {
    localStorage.setItem('petstore.mock-user', 'admin')
    openAdminSite('/orders')
    expect(await screen.findByRole('combobox', { name: 'Lọc trạng thái' })).toBeInTheDocument()
  })

  it('does not serve storefront pages', async () => {
    localStorage.setItem('petstore.mock-user', 'admin')
    openAdminSite('/shop/products')
    expect(await screen.findByText('404')).toBeInTheDocument()
    expect(screen.queryByTestId('product-card')).not.toBeInTheDocument()
  })

  it('blocks a customer with "Không có quyền" and a sign-out button', async () => {
    const user = userEvent.setup()
    localStorage.setItem('petstore.mock-user', 'customer')
    openAdminSite('/')
    expect(await screen.findByRole('heading', { name: 'Không có quyền' })).toBeInTheDocument()
    expect(screen.queryByTestId('kpi')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
    await waitFor(() => expect(localStorage.getItem('petstore.mock-user')).toBeNull())
    expect(await screen.findByText('Vui lòng đăng nhập để tiếp tục')).toBeInTheDocument()
  })
})
