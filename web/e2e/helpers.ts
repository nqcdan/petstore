import { expect, type Page } from '@playwright/test'

export const shot = (page: Page, name: string, fullPage = false) => page.screenshot({ path: `docs/${name}.png`, fullPage })

export async function prefs(page: Page, theme = 'light', lang = 'vi') {
  await page.addInitScript(([th, l]) => {
    localStorage.setItem('theme', th)
    localStorage.setItem('petstore.lang', l)
  }, [theme, lang] as const)
}

// Real Keycloak login (authorization code + PKCE), then back on the SPA.
export async function login(page: Page, username: 'demo-user' | 'demo-admin', from = '/') {
  await page.goto(from)
  // protected routes jump to Keycloak by themselves; public ones need the header button
  const form = page.locator('#username')
  const button = page.getByRole('button', { name: 'Đăng nhập' })
  await form.or(button).first().waitFor()
  if (!(await form.isVisible())) await button.click()
  await page.locator('#username').fill(username)
  await page.locator('#password').fill('Demo@123')
  await page.locator('#kc-login').click()
  await page.waitForURL((u) => u.origin === 'http://localhost:5173')
  // the account menu only renders once Keycloak init finished, i.e. the token source is ready
  await expect(page.getByRole('button', { name: username === 'demo-admin' ? 'Demo Admin' : 'Demo User' })).toBeVisible()
}
