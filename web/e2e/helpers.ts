import { expect, type Page } from '@playwright/test'

export const shot = (page: Page, name: string, fullPage = false) => page.screenshot({ path: `docs/${name}.png`, fullPage })

export async function prefs(page: Page, theme = 'light', lang = 'vi') {
  await page.addInitScript(([th, l]) => {
    localStorage.setItem('theme', th)
    localStorage.setItem('petstore.lang', l)
  }, [theme, lang] as const)
}

const accountMenu = (page: Page, username: 'demo-user' | 'demo-admin') =>
  page.getByRole('button', { name: username === 'demo-admin' ? 'Demo Admin' : 'Demo User' })

// Real Keycloak login (authorization code + PKCE), then back on the SPA.
export async function login(page: Page, username: 'demo-user' | 'demo-admin', from = '/') {
  await page.goto(from)
  // protected routes jump to Keycloak by themselves; public ones need the header button. keycloak-js may still be
  // bouncing the page through Keycloak (top-level check-sso redirect) and swallow the click, so retry until the form is up.
  const form = page.locator('#username')
  const button = page.getByRole('button', { name: 'Đăng nhập' })
  await expect(async () => {
    await form.or(button).first().waitFor({ timeout: 5_000 })
    if (!(await form.isVisible())) await button.click({ timeout: 2_000 })
    await form.waitFor({ timeout: 5_000 })
  }).toPass({ timeout: 30_000 })
  await form.fill(username)
  await page.locator('#password').fill('Demo@123')
  await page.locator('#kc-login').click()
  await page.waitForURL((u) => u.origin === 'http://localhost:5173')
  // the account menu only renders once Keycloak init finished, i.e. the token source is ready
  await expect(accountMenu(page, username)).toBeVisible()
}

// goto for a signed-in user: after a full page load keycloak-js can redirect the page once through Keycloak, which
// tears down the document under a screenshot or click. The account menu shows only after that round trip is over.
export async function open(page: Page, path: string, username: 'demo-user' | 'demo-admin') {
  await page.goto(path)
  await expect(accountMenu(page, username)).toBeVisible()
}
