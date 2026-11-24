import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { adminApi } from '@/api/shop'
import { RequireAuth } from '@/auth/RequireAuth'
import { Dashboard } from '@/admin/Dashboard'
import { Cart } from '@/pages/Cart'
import { Shop } from '@/pages/Shop'
import { resetDb } from '@/mocks/db'
import i18n from '@/i18n'
import { renderAt } from './utils'

beforeEach(async () => {
  localStorage.clear()
  resetDb()
  await i18n.changeLanguage('vi')
})

describe('shop', () => {
  it('lists products from the mock API and adds one to the cart', async () => {
    const user = userEvent.setup()
    renderAt(
      <Routes>
        <Route path="/shop/:kind" element={<Shop />} />
        <Route path="/cart" element={<Cart />} />
      </Routes>,
      '/shop/products',
    )
    const cards = await screen.findAllByTestId('product-card')
    expect(cards).toHaveLength(12)
    await user.click(within(cards[0]).getByRole('button', { name: /Thêm vào giỏ hàng/ }))
    const stored = JSON.parse(localStorage.getItem('petstore.cart') ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].quantity).toBe(1)
  })

  it('filters by search text', async () => {
    const user = userEvent.setup()
    renderAt(<Routes><Route path="/shop/:kind" element={<Shop />} /></Routes>, '/shop/foods')
    await screen.findAllByTestId('product-card')
    await user.type(screen.getByLabelText('Tìm kiếm...'), 'pate{Enter}')
    await waitFor(() => expect(screen.getAllByTestId('product-card').length).toBeLessThan(12))
    for (const c of screen.getAllByTestId('product-card')) expect(c.textContent?.toLowerCase()).toContain('pate')
  })
})

describe('access control', () => {
  const page = (
    <Routes>
      <Route path="/admin" element={<RequireAuth admin><Dashboard /></RequireAuth>} />
    </Routes>
  )

  it('asks anonymous users to sign in', async () => {
    renderAt(page, '/admin')
    expect(await screen.findByText('Vui lòng đăng nhập để tiếp tục')).toBeInTheDocument()
  })

  it('shows demo accounts with copy buttons on the sign-in prompt', async () => {
    const user = userEvent.setup()
    renderAt(page, '/admin')
    const box = await screen.findByTestId('demo-accounts')
    expect(box).toHaveTextContent('demo-user')
    expect(box).toHaveTextContent('demo-admin')
    expect(box).toHaveTextContent('Demo@123')
    await user.click(within(box).getByRole('button', { name: 'Sao chép demo-admin password' }))
    expect(await navigator.clipboard.readText()).toBe('Demo@123')
  })

  it('rejects customers without the admin role', async () => {
    localStorage.setItem('petstore.mock-user', 'customer')
    renderAt(page, '/admin')
    expect(await screen.findByText('Bạn không có quyền truy cập trang này')).toBeInTheDocument()
  })

  it('shows KPIs to admins', async () => {
    localStorage.setItem('petstore.mock-user', 'admin')
    renderAt(page, '/admin')
    expect(await screen.findAllByTestId('kpi')).toHaveLength(4)
  })

  it('API answers 403 for a customer token on /admin/**', async () => {
    localStorage.setItem('petstore.mock-user', 'customer')
    await expect(adminApi.stats()).rejects.toMatchObject({ status: 403 })
  })
})

describe('admin API (mock contract)', () => {
  it('creates, updates and deletes a catalog item', async () => {
    localStorage.setItem('petstore.mock-user', 'admin')
    const created = await adminApi.createCatalog('products', { name: 'Test toy', type: 'CAT', price: 10000, description: '' })
    expect(created.id).toBeGreaterThan(0)
    const updated = await adminApi.updateCatalog('products', created.id, { name: created.name, type: 'CAT', price: 20000, description: '' })
    expect(updated.price).toBe(20000)
    await adminApi.deleteCatalog('products', created.id)
    const page = await adminApi.listCatalog('products', { q: 'Test toy' })
    expect(page.totalItems).toBe(0)
  })

  it('changes the order state', async () => {
    localStorage.setItem('petstore.mock-user', 'admin')
    const { items: content } = await adminApi.listOrders({ state: 'DUE', size: 1 })
    const order = await adminApi.setOrderState(content[0].id, 'PAID')
    expect(order.state).toBe('PAID')
  })
})
