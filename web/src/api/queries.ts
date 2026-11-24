import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi, shopApi } from './shop'
import type { AdminOrderQuery, CatalogInput, CatalogKind, CatalogQuery, OrderState, PageParams } from './types'

export const useCatalog = (kind: CatalogKind, q: CatalogQuery) =>
  useQuery({ queryKey: ['catalog', kind, q], queryFn: () => shopApi.listCatalog(kind, q), placeholderData: keepPreviousData })

export const useProfile = (enabled = true) => useQuery({ queryKey: ['me'], queryFn: shopApi.me, enabled })
export const useMyOrders = () => useQuery({ queryKey: ['orders'], queryFn: shopApi.myOrders })
export const useMyOrder = (id: number) => useQuery({ queryKey: ['orders', id], queryFn: () => shopApi.myOrder(id) })

export const useAdminStats = () => useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats })
export const useAdminCatalog = (kind: CatalogKind, q: PageParams) =>
  useQuery({ queryKey: ['admin', kind, q], queryFn: () => adminApi.listCatalog(kind, q), placeholderData: keepPreviousData })
export const useAdminOrders = (q: AdminOrderQuery) =>
  useQuery({ queryKey: ['admin', 'orders', q], queryFn: () => adminApi.listOrders(q), placeholderData: keepPreviousData })
export const useAdminOrder = (id: number | null) =>
  useQuery({ queryKey: ['admin', 'order', id], queryFn: () => adminApi.getOrder(id!), enabled: id !== null })
export const useAdminCustomers = (q: PageParams) =>
  useQuery({ queryKey: ['admin', 'customers', q], queryFn: () => adminApi.listCustomers(q), placeholderData: keepPreviousData })
export const useAdminEmployees = (q: PageParams) =>
  useQuery({ queryKey: ['admin', 'employees', q], queryFn: () => adminApi.listEmployees(q), placeholderData: keepPreviousData })

export function useSaveCatalog(kind: CatalogKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: CatalogInput }) =>
      id ? adminApi.updateCatalog(kind, id, input) : adminApi.createCatalog(kind, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', kind] }),
  })
}

export function useDeleteCatalog(kind: CatalogKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteCatalog(kind, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', kind] }),
  })
}

export function useSetOrderState() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, state }: { id: number; state: OrderState }) => adminApi.setOrderState(id, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}
