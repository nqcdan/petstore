import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { CatalogItem, CatalogKind } from '@/api/types'
import { MAX_ORDER_LINES, MAX_QUANTITY } from '@/lib/limits'
import { useCart } from './context'

// Adds to the cart and tells the user whether it worked, including the limits the server enforces.
export function useAddToCart() {
  const { t } = useTranslation()
  const { add } = useCart()
  return (kind: CatalogKind, item: CatalogItem) => {
    const result = add(kind, item)
    if (result === 'ok') toast.success(t('shop.added', { name: item.name }))
    else toast.error(t(result === 'lines' ? 'errors.maxLines' : 'errors.maxQuantity', { max: result === 'lines' ? MAX_ORDER_LINES : MAX_QUANTITY }))
    return result === 'ok'
  }
}
