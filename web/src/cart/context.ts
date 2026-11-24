import { createContext, useContext } from 'react'
import type { CatalogItem, CatalogKind } from '@/api/types'

export interface CartLine {
  kind: CatalogKind
  item: CatalogItem
  quantity: number
}

export interface CartState {
  lines: CartLine[]
  count: number
  total: number
  // 'lines' / 'quantity' when a server limit would be exceeded, nothing is added then
  add: (kind: CatalogKind, item: CatalogItem) => 'ok' | 'lines' | 'quantity'
  setQuantity: (kind: CatalogKind, id: number, quantity: number) => void
  remove: (kind: CatalogKind, id: number) => void
  clear: () => void
}

export const CartContext = createContext<CartState | null>(null)

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart outside CartProvider')
  return ctx
}
