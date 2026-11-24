// Captures the screenshots used by the slide decks with Playwright.
// Usage: node capture.mjs [admin|shop|shop-browse|shop-order|all]   (default: all)
// shop-order places one demo order; shop-browse and admin never write data.
// Output: shots/<name>.png (1920x1080, gitignored) and shots/meta.json (highlight boxes).
// Only read operations plus ONE demo order in the shop flow (see README).
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(HERE, 'shots')
const SHOP = 'https://petstore.nqcdan.com'
const ADMIN = 'https://petstore-admin.nqcdan.com'
const META = join(SHOTS, 'meta.json')
mkdirSync(SHOTS, { recursive: true })
const meta = existsSync(META) ? JSON.parse(readFileSync(META, 'utf8')) : {}
const W = 1920
const H = 1080

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Saves a viewport screenshot; `marks` are locators whose boxes become highlight rings in the slide.
async function shot(page, name, { marks = [], viewport = [W, H] } = {}) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await sleep(700)
  const boxes = []
  for (const m of marks) {
    const box = await m.first().boundingBox().catch(() => null)
    if (box) boxes.push({ x: box.x / viewport[0], y: box.y / viewport[1], w: box.width / viewport[0], h: box.height / viewport[1] })
    else console.warn(`  mark not found for ${name}`)
  }
  await page.screenshot({ path: join(SHOTS, `${name}.png`) })
  meta[name] = { marks: boxes }
  writeFileSync(META, JSON.stringify(meta, null, 2))
  console.log('shot', name, boxes.length)
}

// Blurs personal data (emails, phones, usernames, customer names) before a screenshot.
async function blurCells(page, headers) {
  await page.evaluate((hs) => {
    const table = document.querySelector('table')
    if (!table) return
    const heads = [...table.querySelectorAll('thead th')]
    heads.forEach((th, i) => {
      if (!hs.some((h) => th.textContent.trim().toLowerCase() === h)) return
      table.querySelectorAll('tbody tr').forEach((tr) => {
        const td = tr.children[i]
        if (td) td.style.filter = 'blur(6px)'
      })
    })
  }, headers)
}

async function newContext(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, locale: 'en-US', ...opts })
  // English UI by default; theme forced per call.
  await ctx.addInitScript(() => {
    try { if (!localStorage.getItem('petstore.lang')) localStorage.setItem('petstore.lang', 'en') } catch { /* ignore */ }
  })
  return ctx
}

// Waits for the Keycloak login form; the form is captured empty, credentials are typed afterwards.
async function toKeycloak(page, name, marks = []) {
  await page.waitForSelector('#username')
  if (!page.url().includes('kc_locale')) {
    await page.goto(`${page.url()}&kc_locale=en`)
    await page.waitForSelector('#username')
  }
  await page.waitForLoadState('networkidle').catch(() => {})
  if (name) await shot(page, name, { marks: marks.map((s) => page.locator(s)) })
}

async function login(page, user, password) {
  await page.fill('#username', user)
  await page.fill('#password', password)
  await page.click('#kc-login')
}

// The admin host does not proxy /img yet (serves index.html), so product thumbnails come from the shop host.
async function borrowImagesFromShop(ctx) {
  await ctx.route(`${ADMIN}/img/**`, async (route) => {
    const url = new URL(route.request().url())
    const resp = await route.fetch({ url: `${SHOP}${url.pathname}` })
    await route.fulfill({ response: resp })
  })
}

async function admin(browser) {
  const ctx = await newContext(browser)
  await borrowImagesFromShop(ctx)
  const page = await ctx.newPage()
  await page.goto(ADMIN)
  await toKeycloak(page, 'admin-01-keycloak', ['#kc-login', '#username'])
  await login(page, 'demo-admin', 'Demo@123')
  await page.waitForURL(`${ADMIN}/**`)

  await page.getByRole('heading', { name: 'Dashboard' }).waitFor()
  await sleep(1500)
  await shot(page, 'admin-02-dashboard', { marks: [page.locator('[data-testid="kpi"]').first().locator('..'), page.locator('[data-slot="card"]').nth(4)] })

  // Products + search (nothing is saved)
  await page.goto(`${ADMIN}/products`)
  await page.getByRole('row').nth(1).waitFor()
  await shot(page, 'admin-03a-products')
  await page.getByPlaceholder('Search').fill('Balo')
  await sleep(1200)
  await shot(page, 'admin-03-products-search', { marks: [page.getByPlaceholder('Search')] })

  // Create form: pick an image, fill a name, then cancel. Nothing is saved.
  await page.goto(`${ADMIN}/products`)
  await page.getByRole('row').nth(1).waitFor()
  await page.getByRole('button', { name: /Add new/i }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  const img = await ctx.request.get(`${SHOP}/img/product/product2.jpg`)
  await dialog.locator('input[type=file]').setInputFiles({ name: 'sample.jpg', mimeType: 'image/jpeg', buffer: await img.body() })
  await dialog.locator('input').first().fill('Sample dog bed')
  await sleep(600)
  await shot(page, 'admin-04-product-form', { marks: [dialog.getByRole('button', { name: 'Upload image' })] })
  await page.keyboard.press('Escape')

  await page.goto(`${ADMIN}/foods`)
  await page.getByRole('row').nth(1).waitFor()
  await shot(page, 'admin-05-foods')

  // Orders list + status filter (opening the select only, no change)
  await page.goto(`${ADMIN}/orders`)
  await page.getByRole('row').nth(1).waitFor()
  await blurCells(page, ['customer'])
  await shot(page, 'admin-06a-orders')
  await page.getByRole('combobox', { name: /Filter by status/i }).click()
  await sleep(500)
  await blurCells(page, ['customer'])
  await shot(page, 'admin-06-orders-filter', { marks: [page.locator('[aria-label="Filter by status"]')] })
  await page.getByRole('option', { name: /Pending|Due|Awaiting|Unpaid/i }).first().click().catch(async () => { await page.keyboard.press('Escape') })
  await sleep(1200)
  await blurCells(page, ['customer'])
  await shot(page, 'admin-06b-orders-filtered')

  // Order detail + status dropdown (open only, Escape closes without changing). The newest order is a demo-user one: no real names.
  await page.getByRole('button', { name: 'View' }).first().click()
  const od = page.getByRole('dialog')
  await od.getByRole('combobox').waitFor()
  await od.getByRole('combobox').click()
  await sleep(600)
  await shot(page, 'admin-07-order-detail', { marks: [page.locator('#state-select')] })
  await page.keyboard.press('Escape')
  await page.keyboard.press('Escape')

  await page.goto(`${ADMIN}/customers`)
  await page.getByRole('row').nth(1).waitFor()
  await blurCells(page, ['full name', 'username', 'account', 'email', 'phone'])
  await shot(page, 'admin-08-customers')

  await page.goto(`${ADMIN}/employees`)
  await page.getByRole('row').nth(1).waitFor()
  await blurCells(page, ['full name', 'account', 'email', 'phone', 'username'])
  await shot(page, 'admin-09-employees')

  // Sign out, then sign in as the plain customer account: the admin site must refuse it.
  await page.getByRole('button', { name: /Sign out|Log out/i }).click()
  await toKeycloak(page, null)
  await login(page, 'demo-user', 'Demo@123')
  await page.waitForURL(`${ADMIN}/**`)
  await page.getByText(/No permission/i).first().waitFor()
  await shot(page, 'admin-10-forbidden', { marks: [page.getByText(/No permission/i).first()] })
  await ctx.close()
}

// Anonymous browsing: safe to repeat, writes nothing on the server.
async function shopBrowse(browser) {
  const ctx = await newContext(browser)
  const page = await ctx.newPage()

  await page.goto(SHOP)
  await page.getByRole('heading', { level: 1 }).first().waitFor()
  await shot(page, 'shop-01-home', { marks: [page.getByRole('heading', { level: 1 }).first()] })
  await page.locator('[data-testid="product-card"]').first().waitFor()
  await page.evaluate(() => document.querySelector('[data-testid="product-card"]')?.scrollIntoView({ block: 'center' }))
  await sleep(800)
  await shot(page, 'shop-01b-featured')

  await page.goto(`${SHOP}/shop/products`)
  await page.locator('[data-testid="product-card"]').first().waitFor()
  const sort = page.locator('[aria-label="Sort by price"]')
  await sort.click()
  await page.getByRole('option', { name: /High to low/ }).click()
  await sleep(1200)
  const marks = [page.getByPlaceholder('Search'), sort]
  await shot(page, 'shop-02-products', { marks })

  await page.locator('[data-testid="product-card"] button').first().click()
  const dlg = page.getByRole('dialog')
  await dlg.waitFor()
  await sleep(800)
  await shot(page, 'shop-03-detail', { marks: [dlg.getByRole('button', { name: /Add/i })] })
  await dlg.getByRole('button', { name: /Add/i }).click()
  await sleep(800)
  await page.goto(`${SHOP}/shop/foods`)
  await page.locator('[data-testid="product-card"]').first().waitFor()
  await page.locator('[data-testid="product-card"]').nth(1).getByRole('button', { name: /Add/i }).click()
  await sleep(800)
  await page.goto(`${SHOP}/cart`)
  await sleep(1000)
  await shot(page, 'shop-04-cart')

  // Language: same page in Vietnamese
  await page.goto(SHOP)
  await page.evaluate(() => localStorage.setItem('petstore.lang', 'vi'))
  await page.reload()
  await sleep(1500)
  await shot(page, 'shop-10-lang-vi')

  // Dark mode (English)
  await page.evaluate(() => { localStorage.setItem('petstore.lang', 'en'); localStorage.setItem('theme', 'dark') })
  await page.goto(`${SHOP}/shop/foods`)
  await page.locator('[data-testid="product-card"]').first().waitFor()
  await sleep(1000)
  await shot(page, 'shop-11-dark')
  await ctx.close()

  // Mobile 390px
  const m = await newContext(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  const mp = await m.newPage()
  await mp.goto(SHOP)
  await sleep(1500)
  await mp.screenshot({ path: join(SHOTS, 'shop-12-mobile-home.png') })
  await mp.goto(`${SHOP}/shop/products`)
  await mp.locator('[data-testid="product-card"]').first().waitFor()
  await sleep(1200)
  await mp.screenshot({ path: join(SHOTS, 'shop-13-mobile-shop.png') })
  await m.close()
}

// Sign in and place ONE demo order (COD). Run once: every run adds an order to the demo data.
async function shopOrder(browser) {
  const ctx = await newContext(browser)
  const page = await ctx.newPage()
  const tell = {}
  await page.goto(`${SHOP}/shop/products`)
  await page.locator('[data-testid="product-card"]').first().getByRole('button', { name: /Add/i }).click()
  await sleep(800)

  // Checkout needs a session: the SPA redirects to Keycloak (OIDC code + PKCE).
  await page.goto(`${SHOP}/checkout`)
  await toKeycloak(page, 'shop-05-sso', ['#kc-login'])
  await login(page, 'demo-user', 'Demo@123')
  await page.waitForURL(`${SHOP}/**`)
  await page.getByText('Cash on delivery (COD)').waitFor()
  await sleep(800)
  await page.locator('#pay-COD').click()
  await shot(page, 'shop-06-checkout', { marks: [page.getByRole('radiogroup')] })

  await page.getByRole('button', { name: 'Place order' }).click()
  await page.waitForURL(`${SHOP}/orders/**`)
  await sleep(1500)
  tell.orderCode = page.url().split('/orders/')[1]
  await shot(page, 'shop-07-order-success')

  await page.goto(`${SHOP}/orders`)
  await sleep(1500)
  await shot(page, 'shop-08-history')
  await page.goto(`${SHOP}/orders/${tell.orderCode}`)
  await sleep(1200)
  await shot(page, 'shop-09-order-detail')
  await ctx.close()
  writeFileSync(join(SHOTS, 'order.json'), JSON.stringify(tell))
  console.log('order created:', tell.orderCode)
}

const what = process.argv[2] ?? 'all'
const browser = await chromium.launch()
try {
  if (what === 'admin' || what === 'all') await admin(browser)
  if (what === 'shop-browse' || what === 'shop' || what === 'all') await shopBrowse(browser)
  if (what === 'shop-order' || what === 'shop' || what === 'all') await shopOrder(browser)
} finally {
  await browser.close()
}
