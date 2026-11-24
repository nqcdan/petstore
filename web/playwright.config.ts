import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173', viewport: { width: 1280, height: 800 } },
  webServer: { command: 'pnpm exec vite --port 5173', url: 'http://localhost:5173', reuseExistingServer: true },
})
