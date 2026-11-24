import { expect, test, type Page } from '@playwright/test'

// Generates the docs/*.png used by the case study. Runs against the Vite dev server with MSW mocks.
const shot = (page: Page, name: string, fullPage = false) => page.screenshot({ path: `docs/${name}.png`, fullPage })

async function as(page: Page, role: 'customer' | 'admin' | null, theme = 'light', lang = 'vi') {
  await page.addInitScript(([r, th, l]) => {
    if (r) localStorage.setItem('petstore.mock-user', r)
    localStorage.setItem('theme', th)
    localStorage.setItem('petstore.lang', l)
  }, [role, theme, lang] as const)
}

test('storefront', async ({ page }) => {
  await as(page, 'customer')
  await page.goto('/')
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await shot(page, '01-home')

  await page.goto('/shop/products')
  await expect(page.getByTestId('product-card').first()).toBeVisible()
  await page.waitForLoadState('networkidle')
  await shot(page, '02-shop')

  await page.getByTestId('product-card').first().getByRole('button').last().click()
  await page.getByTestId('product-card').nth(2).getByRole('button').last().click()
  await page.goto('/cart')
  await expect(page.getByTestId('cart-line')).toHaveCount(2)
  await shot(page, '03-cart')

  await page.getByRole('link', { name: 'Thanh toán' }).click()
  await expect(page.getByLabel('Họ và tên').or(page.getByText('Chào bạn'))).toBeVisible()
  await page.getByLabel(/Thanh toán khi nhận hàng/).click()
  await shot(page, '04-checkout')
  await page.getByRole('button', { name: 'Đặt hàng' }).click()
  await expect(page.getByText('Chi tiết đơn hàng').first()).toBeVisible()
  await shot(page, '05-order-detail')

  await page.goto('/orders')
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await shot(page, '06-orders')
})

test('storefront dark + english + mobile', async ({ page }) => {
  await as(page, null, 'dark', 'en')
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

test('admin', async ({ page }) => {
  await as(page, 'admin')
  await page.goto('/admin')
  await expect(page.getByTestId('kpi')).toHaveCount(4)
  await page.waitForTimeout(1200) // chart animation
  await shot(page, '10-admin-dashboard', true)

  await page.goto('/admin/products')
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await shot(page, '11-admin-products')
  await page.getByRole('button', { name: 'Sửa' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(400)
  await shot(page, '12-admin-product-form')
  await page.keyboard.press('Escape')

  await page.goto('/admin/orders')
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await shot(page, '13-admin-orders')
  await page.getByRole('button', { name: 'Xem chi tiết' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(300)
  await shot(page, '14-admin-order-detail')
  await page.keyboard.press('Escape')

  await page.goto('/admin/customers')
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await shot(page, '15-admin-customers')
})

test('customer cannot open admin', async ({ page }) => {
  await as(page, 'customer')
  await page.goto('/admin')
  await expect(page.getByText('Bạn không có quyền truy cập trang này')).toBeVisible()
})
