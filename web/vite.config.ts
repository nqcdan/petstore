import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

// VITE_APP=admin builds the admin-only site (own title, favicon and look); anything else is the storefront.
function adminSite(): Plugin {
  return {
    name: 'petstore-admin-site',
    transformIndexHtml(html) {
      return html
        .replace('<html lang="vi">', '<html lang="vi" data-app="admin">')
        .replace('href="/favicon.svg"', 'href="/admin-favicon.svg"')
        .replace('content="PETS Store - thức ăn, vật dụng và dịch vụ cho thú cưng"', 'content="PETS Admin"')
        .replace('<title>PETS Store</title>', '<title>PETS Admin</title>')
        .replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <meta name="robots" content="noindex, nofollow" />')
    },
    // Keep only img/product: the API returns "/img/product/*.jpg" for seeded products and foods (incl. the snack.jpg
    // fallback of imgUrl()). The shop's other photos (hero, blog, about...) are not used by the admin.
    writeBundle(options) {
      const dist = options.dir ?? 'dist'
      fs.rmSync(path.join(dist, 'favicon.svg'), { force: true })
      const img = path.join(dist, 'img')
      for (const e of fs.readdirSync(img)) if (e !== 'product') fs.rmSync(path.join(img, e), { recursive: true })
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(loadEnv(mode, import.meta.dirname, 'VITE_').VITE_APP === 'admin' ? [adminSite()] : [])],
  server: {
    // Real-backend dev/e2e: same-origin calls to the Spring app (no CORS)
    proxy: Object.fromEntries(
      ['/api'].map((p) => [p, { target: process.env.PETSTORE_API ?? 'http://localhost:8081', changeOrigin: true }]),
    ),
  },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    env: { VITE_MOCK: 'true', VITE_SHOW_DEMO_ACCOUNTS: 'true', VITE_API_BASE: 'http://localhost/api/v1' },
    exclude: ['e2e/**', 'node_modules/**'],
  },
}))
