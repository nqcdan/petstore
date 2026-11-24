import { expect, test, type Page } from '@playwright/test'
import { prefs, shot } from './helpers'

// The admin-only site: VITE_APP=admin on :3001, signs in with the public client petstore-admin.
test.use({ baseURL: 'http://localhost:3001' })
test.describe.configure({ mode: 'serial' })

async function signIn(page: Page, username: 'demo-user' | 'demo-admin') {
  await page.goto('/')
  // the whole site is protected: Keycloak's login page comes up by itself
  await page.locator('#username').fill(username)
  await page.locator('#password').fill('Demo@123')
  await page.locator('#kc-login').click()
  await page.waitForURL((u) => u.origin === 'http://localhost:3001')
}

test('demo-admin: dashboard at /, PETS Admin branding, token for petstore-api', async ({ page }) => {
  await prefs(page)
  await signIn(page, 'demo-admin')
  await expect(page).toHaveTitle('PETS Admin')
  await expect(page.getByTestId('kpi')).toHaveCount(4)
  await expect(page.getByText('PETS Admin', { exact: true })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-app', 'admin')

  // client petstore-admin, audience petstore-api (mapper), role admin
  const token = await page.evaluate(async () => {
    const { keycloak } = await import('/src/auth/keycloak.ts')
    const t = keycloak.tokenParsed as { aud?: string | string[]; azp?: string; realm_access?: { roles: string[] } }
    return { aud: t.aud, azp: t.azp, roles: t.realm_access?.roles }
  })
  expect(token.azp).toBe('petstore-admin')
  expect([token.aud].flat()).toContain('petstore-api')
  expect(token.roles).toContain('admin')

  await page.waitForTimeout(1200)
  await shot(page, '16-admin-site', true)
})

test('demo-admin: screens live at the root, not under /admin', async ({ page }) => {
  await prefs(page)
  await signIn(page, 'demo-admin')
  for (const [path, heading] of [['products', 'Vật phẩm'], ['foods', 'Thức ăn'], ['orders', 'Đơn hàng'], ['customers', 'Khách hàng'], ['employees', 'Nhân viên']] as const) {
    await page.getByRole('link', { name: heading, exact: true }).first().click()
    await expect(page).toHaveURL(new RegExp(`/${path}$`))
    await expect(page.getByRole('row').nth(1)).toBeVisible()
  }
  await page.goto('/shop/products')
  await expect(page.getByText('404')).toBeVisible()
})

test('demo-admin: every product and food picture in the lists loads (no broken image)', async ({ page }) => {
  await prefs(page)
  await signIn(page, 'demo-admin')
  for (const path of ['products', 'foods']) {
    await page.goto(`/${path}`)
    // while the list loads the table shows skeleton rows: wait for the first real picture, not just a second row
    const imgs = page.locator('table img')
    await expect(imgs.first()).toBeVisible()
    // an <img> whose URL answers HTML (SPA fallback) or 404 ends with naturalWidth 0
    await expect.poll(() => imgs.evaluateAll((els) => els.filter((e) => !(e as HTMLImageElement).complete || (e as HTMLImageElement).naturalWidth === 0).length)).toBe(0)
  }
})

test('demo-user is blocked with "Không có quyền" and can sign out', async ({ page }) => {
  await prefs(page)
  await signIn(page, 'demo-user')
  await expect(page.getByRole('heading', { name: 'Không có quyền' })).toBeVisible()
  await expect(page.getByTestId('kpi')).toHaveCount(0)

  // the API refuses the same token too
  const status = await page.evaluate(async () => {
    const { adminApi } = await import('/src/api/shop.ts')
    try { await adminApi.stats(); return 200 } catch (e) { return (e as { status: number }).status }
  })
  expect(status).toBe(403)

  await page.getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(page.locator('#username')).toBeVisible()
})
