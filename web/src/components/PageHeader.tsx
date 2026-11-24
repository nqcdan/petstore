import type { ReactNode } from 'react'

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <div className="border-b bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {sub && <p className="mt-1 text-muted-foreground">{sub}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}
