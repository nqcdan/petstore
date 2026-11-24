import { expect, test } from '@playwright/test'
import { login, prefs, shot } from './helpers'

test('anonymous: landing, shop and demo accounts box', async ({ page }) => {
  await prefs(page)
  await page.goto('/')
  await expect(page.getByTestId('demo-accounts')).toContainText('demo-admin')
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await shot(page, '01-home')

  await page.goto('/shop/products')
  await expect(page.getByTestId('product-card')).toHaveCount(12)
  await page.waitForLoadState('networkidle')
  await shot(page, '02-shop')
})

test('demo-user buys, reaches checkout and sees the order in history', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-user')

  await page.goto('/shop/foods')
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  await page.getByTestId('product-card').nth(0).getByRole('button').last().click()
  await page.getByTestId('product-card').nth(1).getByRole('button').last().click()
  await page.goto('/cart')
  await expect(page.getByTestId('cart-line')).toHaveCount(2)
  await shot(page, '03-cart')

  await page.getByRole('link', { name: 'Thanh toán' }).click()
  await expect(page.getByText('Đơn hàng của bạn')).toBeVisible()
  await page.getByLabel(/Thanh toán khi nhận hàng/).click()
  await shot(page, '04-checkout')
  await page.getByRole('button', { name: 'Đặt hàng' }).click()

  await expect(page).toHaveURL(/\/orders\/OD-/)
  const code = page.url().split('/').pop()!
  await expect(page.getByText('Chi tiết đơn hàng').first()).toBeVisible()
  await expect(page.getByText(code).first()).toBeVisible()
  await expect(page.getByText(/Thanh toán: Thanh toán khi nhận hàng/)).toBeVisible()
  await shot(page, '05-order-detail')

  await page.goto('/orders')
  await expect(page.getByRole('cell', { name: code })).toBeVisible()
  await shot(page, '06-orders')
})

test('demo-user pays by ATM transfer', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-user')
  await page.goto('/shop/products')
  await page.getByTestId('product-card').first().getByRole('button').last().click()
  await page.goto('/checkout')
  await page.getByLabel(/Chuyển khoản ATM/).click()
  await page.getByRole('button', { name: 'Đặt hàng' }).click()
  await expect(page).toHaveURL(/\/orders\/OD-/)
  await expect(page.getByText(/Thanh toán: Chuyển khoản ATM/)).toBeVisible()
})

test("demo-user cannot see another user's order", async ({ page, browser }) => {
  // demo-admin places an order as a customer
  const adminCtx = await browser.newContext()
  const adminPage = await adminCtx.newPage()
  await prefs(adminPage)
  await login(adminPage, 'demo-admin')
  const code = await adminPage.evaluate(async () => {
    const { shopApi } = await import('/src/api/shop.ts')
    const { items } = await shopApi.listCatalog('foods', { size: 1 })
    return (await shopApi.createOrder({ items: [{ type: 'FOOD', id: items[0].id, quantity: 1 }] })).code
  })
  await adminCtx.close()

  await prefs(page)
  await login(page, 'demo-user')
  await page.goto(`/orders/${code}`)
  await expect(page.getByRole('alert')).toContainText('Không tìm thấy dữ liệu yêu cầu')
  await page.goto('/orders')
  await expect(page.getByRole('cell', { name: code })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Demo User' })).toBeVisible() // token ready
  const status = await page.evaluate(async (c) => {
    const { shopApi } = await import('/src/api/shop.ts')
    try { await shopApi.myOrder(c); return 200 } catch (e) { return (e as { status: number }).status }
  }, code)
  expect(status).toBe(404)
})

test('demo-user is blocked from /admin', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-user')
  await page.goto('/admin')
  await expect(page.getByText('Bạn không có quyền truy cập trang này')).toBeVisible()
  // the API refuses too, not only the UI
  const status = await page.evaluate(async () => {
    const { adminApi } = await import('/src/api/shop.ts')
    try { await adminApi.stats(); return 200 } catch (e) { return (e as { status: number }).status }
  })
  expect(status).toBe(403)
})

test('dark + english + mobile', async ({ page }) => {
  await prefs(page, 'dark', 'en')
  await page.goto('/')
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await shot(page, '07-home-dark-en')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/shop/foods')
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await shot(page, '08-shop-mobile-dark')
})
