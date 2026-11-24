import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CartContext, type CartLine, type CartState } from './context'

const KEY = 'petstore.cart'

function load(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartLine[]
  } catch {
    return []
  }
}

// The old app kept the cart in a server session + cookie; the new one keeps it client side
// and sends it once in POST /orders.
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load)

  useEffect(() => localStorage.setItem(KEY, JSON.stringify(lines)), [lines])

  const add = useCallback<CartState['add']>((kind, item) => {
    setLines((prev) => {
      const found = prev.find((l) => l.kind === kind && l.item.id === item.id)
      return found
        ? prev.map((l) => (l === found ? { ...l, quantity: l.quantity + 1 } : l))
        : [...prev, { kind, item, quantity: 1 }]
    })
  }, [])
  const setQuantity = useCallback<CartState['setQuantity']>((kind, id, quantity) => {
    setLines((prev) => prev.map((l) => (l.kind === kind && l.item.id === id ? { ...l, quantity: Math.max(1, quantity) } : l)))
  }, [])
  const remove = useCallback<CartState['remove']>((kind, id) => {
    setLines((prev) => prev.filter((l) => !(l.kind === kind && l.item.id === id)))
  }, [])
  const clear = useCallback(() => setLines([]), [])

  const value = useMemo<CartState>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.quantity, 0),
      total: lines.reduce((s, l) => s + l.quantity * l.item.price, 0),
      add, setQuantity, remove, clear,
    }),
    [lines, add, setQuantity, remove, clear],
  )
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
