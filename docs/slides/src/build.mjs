// Builds the two slide PDFs from shots/*.png (made by capture.mjs) with Playwright page.pdf.
// Usage: node build.mjs [admin|shop|all]   (default: all)
import { chromium } from 'playwright'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = dirname(fileURLToPath(import.meta.url))
const OUT = join(HERE, '..')
const SHOTS = join(HERE, 'shots')
const ROOT = join(HERE, '..', '..', '..')
const require = createRequire(import.meta.url)
const meta = JSON.parse(readFileSync(join(SHOTS, 'meta.json'), 'utf8'))

const GITHUB = 'https://github.com/nqcdan/petstore'
const SHOP = 'https://petstore.nqcdan.com'
const ADMIN = 'https://petstore-admin.nqcdan.com'

// ---------- fonts (embedded as base64, Inter variable, latin + vietnamese) ----------
const fontDir = dirname(require.resolve('@fontsource-variable/inter/package.json')) + '/files/'
const face = (file, range) =>
  `@font-face{font-family:Inter;font-weight:100 900;font-style:normal;src:url(data:font/woff2;base64,${readFileSync(fontDir + file).toString('base64')}) format('woff2');unicode-range:${range}}`
const FONTS = [
  face('inter-latin-wght-normal.woff2', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'),
  face('inter-vietnamese-wght-normal.woff2', 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB'),
  face('inter-latin-ext-wght-normal.woff2', 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF'),
].join('\n')

const PAW = readFileSync(join(ROOT, 'keycloak/themes/petstore/login/resources/img/paw.svg'), 'utf8')
const ARCH = join(ROOT, 'docs/architecture/petstore-deployment-architecture.png')

const CSS = `
${FONTS}
@page{size:1920px 1080px;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1920px;background:#fff}
body{font-family:Inter,sans-serif;color:#1c1917;-webkit-font-smoothing:antialiased}
.slide{position:relative;width:1920px;height:1080px;overflow:hidden;page-break-after:always;break-after:page;background:#faf7f4}
.slide:last-child{page-break-after:auto;break-after:auto}
.logo{display:flex;align-items:center;gap:16px;font-weight:800;font-size:44px;letter-spacing:-.5px}
.logo i{display:flex;width:64px;height:64px;border-radius:50%;background:#e2611f;align-items:center;justify-content:center}
.logo i svg{width:34px;height:34px}
.logo b{color:#e2611f;font-weight:800}
.logo.sm{font-size:26px;gap:10px}.logo.sm i{width:38px;height:38px}.logo.sm i svg{width:20px;height:20px}
.head{position:absolute;left:80px;top:56px;right:80px;display:flex;align-items:center;gap:28px}
.step{flex:none;width:84px;height:84px;border-radius:24px;background:#e2611f;color:#fff;font-size:42px;font-weight:700;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(226,97,31,.35)}
.head h1{font-size:54px;font-weight:700;letter-spacing:-1px;line-height:1.05}
.head h2{font-size:27px;font-weight:500;color:#78716c;margin-top:8px}
.frame{position:absolute;left:80px;top:196px;width:1320px;height:742.5px;border-radius:22px;overflow:hidden;background:#fff;box-shadow:0 0 0 1px rgba(28,25,23,.12),0 24px 60px rgba(28,25,23,.28)}
.frame img.shot{position:absolute;display:block;max-width:none}
.ring{position:absolute;border:5px solid #e11d48;border-radius:14px;box-shadow:0 0 0 3px rgba(255,255,255,.9),0 0 24px rgba(225,29,72,.55)}
.side{position:absolute;left:1450px;top:196px;width:390px;height:742.5px;display:flex;flex-direction:column;justify-content:center;gap:28px}
.cap{font-size:29px;line-height:1.42;color:#292524;font-weight:500}
.chips{display:flex;flex-wrap:wrap;gap:10px}
.chip{font-size:21px;font-weight:600;padding:8px 16px;border-radius:999px;background:#fff;border:2px solid #e7d9cf;color:#9a3d0d}
.tag{font-size:19px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e;font-weight:700}
.foot{position:absolute;left:80px;right:80px;bottom:30px;display:flex;justify-content:space-between;align-items:center;font-size:20px;color:#a8a29e;font-weight:500}
.foot a{color:inherit;text-decoration:none}
.pair{position:absolute;left:80px;top:196px;width:1760px;height:742.5px;display:flex;gap:40px}
.pair .col{flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px}
.pair .frame{position:relative;left:0;top:0;width:860px;height:483.75px}
.pair .lbl{font-size:28px;font-weight:700;color:#44403c}
.pair .cap{font-size:27px}
.phones{position:absolute;left:80px;top:196px;width:1320px;height:742.5px;display:flex;gap:60px;align-items:center;justify-content:center}
.phone{width:334px;height:712px;border-radius:44px;background:#111;padding:12px;box-shadow:0 24px 60px rgba(28,25,23,.35)}
.phone div{width:100%;height:100%;border-radius:34px;overflow:hidden;background:#fff}
.phone img{width:100%;display:block}
/* cover */
.cover{background:radial-gradient(1100px 650px at 85% 10%,rgba(226,97,31,.32) 0,transparent 65%),linear-gradient(135deg,#1c1917 0,#292524 100%);color:#fff}
.cover .logo{position:absolute;left:120px;top:100px;font-size:56px}.cover .logo i{width:80px;height:80px}.cover .logo i svg{width:42px;height:42px}
.cover .logo{color:#fff}
.cover h1{position:absolute;left:120px;top:330px;font-size:112px;font-weight:800;letter-spacing:-3px;line-height:1.02;width:1200px}
.cover h2{position:absolute;left:120px;top:640px;font-size:40px;font-weight:500;color:#d6d3d1;width:1100px;line-height:1.4}
.cover .links{position:absolute;left:120px;bottom:100px;font-size:30px;line-height:1.7;color:#fdba74;font-weight:600}
.cover .links span{color:#a8a29e;font-weight:500;margin-right:14px}
.cover .deco{position:absolute;right:-140px;bottom:-140px;width:720px;height:720px;border-radius:50%;background:#e2611f;opacity:.9;display:flex;align-items:center;justify-content:center}
.cover .deco svg{width:380px;height:380px;margin:-80px 0 0 -80px}
.cover .deco svg *{stroke-width:1.4}
/* closing */
.end{background:#fff}
.end h1{position:absolute;left:80px;top:60px;font-size:64px;font-weight:800;letter-spacing:-1.5px}
.end h2{position:absolute;left:80px;top:150px;font-size:27px;font-weight:500;color:#78716c}
.end .arch{position:absolute;left:740px;top:140px;width:1100px;border-radius:20px;border:2px solid #eee4dc;padding:12px;background:#fff}
.end .arch img{width:100%;display:block}
.end ul{position:absolute;left:80px;top:260px;width:620px;list-style:none;font-size:29px;line-height:1.5}
.end li{margin-bottom:22px}.end li b{display:block;font-size:20px;letter-spacing:2px;text-transform:uppercase;color:#a8a29e}
.end li span{color:#9a3d0d;font-weight:600}
`

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const logo = (cls = '') => `<div class="logo ${cls}"><i>${PAW}</i><span>PETS<b>Store</b></span></div>`

// ---------- slide builders ----------
function frame(slide, { w = 1320, h = 742.5 } = {}) {
  const [cx, cy, cw, ch] = slide.crop ?? [0, 0, 1920, 1080]
  const scale = w / cw
  const marks = (meta[slide.img]?.marks ?? [])
    .map((m) => {
      const x = (m.x * 1920 - cx) * scale - 8
      const y = (m.y * 1080 - cy) * scale - 8
      return `<div class="ring" style="left:${x}px;top:${y}px;width:${m.w * 1920 * scale + 16}px;height:${m.h * 1080 * scale + 16}px"></div>`
    })
    .join('')
  return `<div class="frame" style="width:${w}px;height:${h}px"><img class="shot" data-src="${slide.img}.png" style="width:${1920 * scale}px;left:${-cx * scale}px;top:${-cy * scale}px">${marks}</div>`
}

const foot = (deck, n, total) =>
  `<div class="foot"><span>${logo('sm').replace('class="logo sm"', 'class="logo sm" style="display:inline-flex"')}</span><span>${deck.footer} &nbsp;·&nbsp; ${n} / ${total}</span></div>`

function stepSlide(deck, s, i, n, total) {
  const side = `<div class="side"><div class="tag">${esc(s.tag ?? 'What you see')}</div><p class="cap">${esc(s.caption)}</p><div class="chips">${s.tech.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}</div></div>`
  let body
  if (s.kind === 'pair') {
    body = `<div class="pair">${s.items
      .map((it) => `<div class="col"><div class="lbl">${esc(it.label)}</div>${frame(it, { w: 860, h: 483.75 })}<p class="cap">${esc(it.caption)}</p></div>`)
      .join('')}</div>`
  } else if (s.kind === 'phones') {
    body = `<div class="phones">${s.imgs.map((im) => `<div class="phone"><div><img data-src="${im}.png"></div></div>`).join('')}</div>${side}`
  } else {
    body = frame(s) + side
  }
  const head = `<div class="head"><div class="step">${String(n).padStart(2, '0')}</div><div><h1>${esc(s.title)}</h1><h2>${esc(s.vi)}</h2></div></div>`
  return `<section class="slide">${head}${body}${foot(deck, i, total)}</section>`
}

function coverSlide(deck) {
  return `<section class="slide cover">${logo()}<h1>${esc(deck.title)}</h1><h2>${esc(deck.subtitle)}<br><span style="color:#a8a29e;font-size:32px">${esc(deck.vi)}</span></h2>
<div class="links">${deck.links.map(([k, v]) => `<div><span>${k}</span>${v}</div>`).join('')}</div>
<div class="deco">${PAW.replace('stroke="#fff"', 'stroke="#fff" opacity=".35"')}</div></section>`
}

function endSlide(deck, total) {
  return `<section class="slide end"><h1>How it fits together</h1><h2>Kiến trúc triển khai và các liên kết</h2>
<ul>
<li><b>Live demo</b><span>${SHOP.replace('https://', '')}</span><br><span>${ADMIN.replace('https://', '')}</span></li>
<li><b>Source</b><span>${GITHUB.replace('https://', '')}</span></li>
<li><b>Stack</b>React 19 + Vite SPA, Spring Boot 3.5 (Java 21), PostgreSQL + Liquibase, Keycloak OIDC</li>
<li><b>Demo accounts (public)</b>demo-user, demo-admin</li>
</ul>
<div class="arch"><img data-src="@arch"></div>
<div class="foot" style="left:80px;right:auto"><span>${deck.footer} &nbsp;·&nbsp; ${total} / ${total}</span></div></section>`
}

// ---------- decks ----------
const admin = {
  file: 'petstore-admin-walkthrough.pdf',
  footer: 'Admin walkthrough',
  title: 'PETSStore admin walkthrough',
  subtitle: 'Dashboard, catalogue, orders and people, behind Keycloak SSO and role checks.',
  vi: 'Hướng dẫn trang quản trị PETSStore',
  links: [['Admin', ADMIN], ['Shop', SHOP], ['GitHub', GITHUB]],
  slides: [
    { img: 'admin-01-keycloak', crop: [0, 170, 1280, 720], title: 'Sign in with Keycloak SSO', vi: 'Đăng nhập qua Keycloak',
      caption: 'The admin site has no password form of its own. It redirects to the petstore realm, themed with the shop branding. The credentials are typed after this capture.',
      tech: ['OIDC code + PKCE', 'keycloak-js', 'Custom login theme'] },
    { img: 'admin-02-dashboard', title: 'Dashboard', vi: 'Tổng quan',
      caption: 'Four KPIs, 30-day revenue from paid orders, orders by status and best sellers, all loaded from one stats call.',
      tech: ['GET /api/v1/admin/stats', 'Recharts', 'TanStack Query'] },
    { img: 'admin-03-products-search', title: 'Products and search', vi: 'Danh sách vật phẩm và tìm kiếm',
      caption: 'Paged catalogue with server-side search: typing "Balo" narrows 40 items to one. Edit and delete sit on each row.',
      tech: ['GET /api/v1/admin/products', 'Spring Data paging', 'TanStack Table'] },
    { img: 'admin-04-product-form', crop: [480, 270, 960, 540], title: 'Create or edit an item', vi: 'Form thêm / sửa, tải ảnh lên',
      caption: 'Dialog form with image preview. The image is uploaded after the item is saved. Cancelled here, nothing was stored.',
      tech: ['react-hook-form + zod', 'multipart /image upload'] },
    { img: 'admin-05-foods', title: 'Pet food', vi: 'Thức ăn',
      caption: 'The same catalogue screen serves food (DRY, WET, SNACK, MILK) by switching the kind parameter. Catalogue seed data comes from Liquibase.',
      tech: ['GET /api/v1/admin/foods', 'Liquibase seed'] },
    { img: 'admin-06-orders-filter', title: 'Orders and status filter', vi: 'Danh sách đơn và lọc trạng thái',
      caption: 'Orders with search and a status filter: shipping / awaiting payment, completed or cancelled. Customer names are blurred in this deck.',
      tech: ['GET /api/v1/admin/orders?state=', 'URL query state'] },
    { img: 'admin-07-order-detail', crop: [480, 330, 960, 540], title: 'Order detail and status change', vi: 'Chi tiết đơn, đổi trạng thái',
      caption: 'Lines, payment method and a status selector. Only legal transitions are enabled. The dropdown was opened but nothing was changed.',
      tech: ['PATCH /admin/orders/{id}/state', 'State machine'] },
    { img: 'admin-08-customers', title: 'Customers', vi: 'Khách hàng',
      caption: 'Customer accounts with verification state. Names, accounts, emails and phones are blurred in this deck.',
      tech: ['GET /api/v1/admin/customers'] },
    { img: 'admin-09-employees', title: 'Employees', vi: 'Nhân viên',
      caption: 'Staff accounts with a role badge: Admin, Moderator, Write or Read. Personal columns are blurred in this deck.',
      tech: ['GET /api/v1/admin/employees', 'Role badge'] },
    { img: 'admin-10-forbidden', crop: [560, 40, 800, 450], title: 'No permission', vi: 'Không có quyền',
      caption: 'Signed in as demo-user (a customer): the SPA shows "No permission". The API refuses the same token on every /api/v1/admin call.',
      tech: ['hasRole("ADMIN")', 'Spring Security resource server', 'Keycloak roles'] },
  ],
}

const shop = {
  file: 'petstore-storefront-flow.pdf',
  footer: 'Storefront flow',
  title: 'PETSStore storefront flow',
  subtitle: 'A customer journey through the React SPA: browse, cart, Keycloak sign-in, checkout and order history.',
  vi: 'Luồng mua hàng trên web PETSStore',
  links: [['Shop', SHOP], ['Admin', ADMIN], ['GitHub', GITHUB]],
  slides: [
    { img: 'shop-01-home', title: 'Home', vi: 'Trang chủ',
      caption: 'Hero carousel and category tiles. No sign-in is needed to browse. The EN toggle, theme switch and cart sit in the header.',
      tech: ['React 19 + Vite', 'Tailwind + shadcn/ui'] },
    { img: 'shop-01b-featured', crop: [320, 0, 1280, 720], title: 'Featured products', vi: 'Sản phẩm nổi bật',
      caption: 'The API has no featured flag: the SPA asks for the priciest items and mixes the types so the row looks varied.',
      tech: ['GET /api/v1/products?sort=price,desc', 'TanStack Query cache'] },
    { img: 'shop-02-products', title: 'Accessories: sort and search', vi: 'Vật phẩm: lọc, tìm kiếm',
      caption: 'Search by name and sort by price. Sort and query live in the URL, so a filtered list can be shared.',
      tech: ['?q= &sort=price,desc', 'Server-side paging, 12 per page'] },
    { img: 'shop-03-detail', title: 'Item details and add to cart', vi: 'Chi tiết, thêm vào giỏ',
      caption: 'A dialog shows the photo, price and description. Add to cart works for guests too.',
      tech: ['Radix Dialog', 'Cart in localStorage'] },
    { img: 'shop-04-cart', crop: [320, 0, 1280, 720], title: 'Cart', vi: 'Giỏ hàng',
      caption: 'Quantities, line totals and a subtotal. Checkout is the first step that needs an account.',
      tech: ['React context cart', 'Guest cart persists'] },
    { img: 'shop-05-sso', title: 'Sign in through Keycloak', vi: 'Đăng nhập SSO Keycloak',
      caption: 'Checkout is a protected route, so the SPA redirects to Keycloak. The same realm and theme serve the shop and the admin site.',
      tech: ['OIDC Authorization Code + PKCE', 'RequireAuth route'] },
    { img: 'shop-06-checkout', crop: [320, 0, 1280, 720], title: 'Checkout', vi: 'Thanh toán, chọn COD hoặc ATM',
      caption: 'Name and email come from the signed-in profile. Choose cash on delivery or ATM transfer, then place the order.',
      tech: ['GET /api/v1/me', 'POST /api/v1/orders', 'COD / ATM'] },
    { img: 'shop-07-order-success', crop: [320, 0, 1280, 720], title: 'Order placed', vi: 'Đặt hàng thành công',
      caption: 'The API returns the order code and the SPA opens its detail page with a confirmation toast. New orders start as awaiting payment.',
      tech: ['Order code OD-XXXXXXXX', 'sonner toast'] },
    { img: 'shop-08-history', crop: [320, 0, 1280, 720], title: 'Order history', vi: 'Lịch sử đơn hàng',
      caption: 'Only the signed-in customer\'s own orders are listed, newest first.',
      tech: ['GET /api/v1/orders', 'Owner check by token subject'] },
    { img: 'shop-09-order-detail', crop: [320, 0, 1280, 720], title: 'Order detail', vi: 'Chi tiết đơn hàng',
      caption: 'Status, date, payment method, lines and total. The same order shows up in the admin site, where staff can move its status.',
      tech: ['GET /api/v1/orders/{code}'] },
    { kind: 'pair', title: 'Language: Vietnamese and English', vi: 'Đổi ngôn ngữ vi / en',
      caption: '', tech: ['i18next', 'localStorage'],
      items: [
        { img: 'shop-10-lang-vi', crop: [320, 0, 1280, 720], label: 'Tiếng Việt (default)', caption: 'The default language is Vietnamese.' },
        { img: 'shop-01-home', crop: [320, 0, 1280, 720], label: 'English', caption: 'The globe button switches at once, no reload; the choice is remembered.' },
      ] },
    { img: 'shop-11-dark', title: 'Dark mode', vi: 'Chế độ tối',
      caption: 'Light, dark or system theme from the header. Product photos and the layout stay the same.',
      tech: ['next-themes', 'CSS variables'] },
    { kind: 'phones', imgs: ['shop-12-mobile-home', 'shop-13-mobile-shop'], title: 'Mobile, 390 px', vi: 'Giao diện điện thoại',
      caption: 'The layout collapses to a hamburger menu and a two-column grid. Add to cart shrinks to an icon button.',
      tech: ['Responsive grid', '390 x 844 @2x'] },
  ],
}

// ---------- render ----------
async function render(browser, deck) {
  const slides = deck.slides
  const total = slides.length + 2
  const html = [coverSlide(deck)]
  slides.forEach((s, k) => html.push(stepSlide(deck, s, k + 2, k + 1, total)))
  html.push(endSlide(deck, total))
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(deck.title)}</title><style>${CSS}</style></head><body>${html.join('\n')}</body></html>`)
  const images = {}
  const need = new Set(await page.$$eval('img[data-src]', (els) => els.map((e) => e.dataset.src)))
  for (const name of need) {
    const file = name === '@arch' ? ARCH : join(SHOTS, name)
    if (!existsSync(file)) throw new Error(`missing ${file}; run npm run capture first`)
    images[name] = `data:image/png;base64,${readFileSync(file).toString('base64')}`
  }
  // Re-encode screenshots as JPEG in the page so the PDF embeds compact images (the architecture diagram stays PNG).
  await page.evaluate(async (imgs) => {
    const load = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })
    for (const el of document.querySelectorAll('img[data-src]')) {
      const key = el.dataset.src
      const im = await load(imgs[key])
      if (key === '@arch') { el.src = imgs[key]; continue }
      const c = document.createElement('canvas')
      c.width = im.naturalWidth; c.height = im.naturalHeight
      c.getContext('2d').drawImage(im, 0, 0)
      el.src = c.toDataURL('image/jpeg', 0.86)
    }
  }, images)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0))
  const out = join(OUT, deck.file)
  await page.pdf({ path: out, preferCSSPageSize: true, landscape: true, printBackground: true })
  await page.close()
  console.log(`${deck.file}: ${total} pages, ${(statSync(out).size / 1e6).toFixed(2)} MB`)
}

const what = process.argv[2] ?? 'all'
const browser = await chromium.launch()
try {
  if (what === 'admin' || what === 'all') await render(browser, admin)
  if (what === 'shop' || what === 'all') await render(browser, shop)
} finally {
  await browser.close()
}
