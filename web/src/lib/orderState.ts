import type { OrderState } from '@/api/types'

// Same lifecycle the backend enforces (409 otherwise): DUE -> PAID | CANCEL, PAID -> CANCEL, CANCEL is final.
const NEXT: Record<OrderState, OrderState[]> = { DUE: ['PAID', 'CANCEL'], PAID: ['CANCEL'], CANCEL: [] }

export const canMove = (from: OrderState | null, to: OrderState) => from === null || from === to || NEXT[from].includes(to)
