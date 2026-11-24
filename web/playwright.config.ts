import { defineConfig } from '@playwright/test'

// Runs against the REAL stack: phase A compose (app :8081, Postgres, Keycloak :8180) + Vite in "e2e" mode (MSW off).
// Two sites from the same sources: the shop on :5173 and the admin-only site (VITE_APP=admin, client petstore-admin) on :3001.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  reporter: 'list',
  use: { baseURL: 'http://localhost:5173', viewport: { width: 1280, height: 800 }, locale: 'vi-VN' },
  webServer: [
    { command: 'pnpm exec vite --mode e2e --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: false },
    {
      command: 'VITE_APP=admin VITE_KEYCLOAK_CLIENT_ID=petstore-admin pnpm exec vite --mode e2e --port 3001 --strictPort',
      url: 'http://localhost:3001',
      reuseExistingServer: false,
    },
  ],
})
