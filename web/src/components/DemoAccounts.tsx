import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export const SHOW_DEMO_ACCOUNTS = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true'

const accounts = [
  { user: 'demo-user', password: 'Demo@123' },
  { user: 'demo-admin', password: 'Demo@123' },
]

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false)
  return (
    <Button type="button" variant="ghost" size="icon-xs" aria-label={label}
      onClick={() => {
        void navigator.clipboard?.writeText(text)
        setDone(true)
        setTimeout(() => setDone(false), 1500)
      }}>
      {done ? <Check /> : <Copy />}
    </Button>
  )
}

// Public demo credentials; only rendered when VITE_SHOW_DEMO_ACCOUNTS=true.
export function DemoAccounts({ className }: { className?: string }) {
  const { t } = useTranslation()
  if (!SHOW_DEMO_ACCOUNTS) return null
  return (
    <aside className={`rounded-lg border bg-card p-3 text-left text-sm ${className ?? ''}`} data-testid="demo-accounts">
      <p className="mb-2 font-medium">{t('auth.demoTitle')}</p>
      <ul className="space-y-1">
        {accounts.map((a) => (
          <li key={a.user} className="flex items-center gap-2">
            <code className="font-mono text-xs">{a.user}</code>
            <CopyButton text={a.user} label={`${t('auth.copy')} ${a.user}`} />
            <span className="text-muted-foreground">/</span>
            <code className="font-mono text-xs">{a.password}</code>
            <CopyButton text={a.password} label={`${t('auth.copy')} ${a.user} password`} />
          </li>
        ))}
      </ul>
    </aside>
  )
}
