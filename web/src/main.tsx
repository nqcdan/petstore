import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'

async function boot() {
  if (import.meta.env.VITE_MOCK === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
  }
  // The constant is inlined at build time, so the admin bundle never contains the storefront (and vice versa).
  const Root = import.meta.env.VITE_APP === 'admin' ? (await import('./AdminApp')).AdminApp : (await import('./App')).App
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Root />
    </StrictMode>,
  )
}

void boot()
