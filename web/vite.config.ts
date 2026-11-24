import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
})
