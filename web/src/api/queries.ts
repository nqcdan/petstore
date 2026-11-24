import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi, shopApi } from './shop'
import type { AccountInput, AccountKind, AdminOrderQuery, CatalogInput, CatalogKind, CatalogQuery, OrderState, PageParams } from './types'

export const useCatalog = (kind: CatalogKind, q: CatalogQuery) =>
  useQuery({ queryKey: ['catalog', kind, q], queryFn: () => shopApi.listCatalog(kind, q), placeholderData: keepPreviousData })

export const useMe = () => useQuery({ queryKey: ['me'], queryFn: shopApi.me })
export const useMyOrders = () => useQuery({ queryKey: ['orders'], queryFn: shopApi.myOrders, select: (p) => p.items })
export const useMyOrder = (code: string) => useQuery({ queryKey: ['orders', code], queryFn: () => shopApi.myOrder(code) })

export const useAdminStats = () => useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.stats })
export const useAdminCatalog = (kind: CatalogKind, q: PageParams) =>
  useQuery({ queryKey: ['admin', kind, q], queryFn: () => adminApi.listCatalog(kind, q), placeholderData: keepPreviousData })
export const useAdminOrders = (q: AdminOrderQuery) =>
  useQuery({ queryKey: ['admin', 'orders', q], queryFn: () => adminApi.listOrders(q), placeholderData: keepPreviousData })
export const useAdminOrder = (id: number | null) =>
  useQuery({ queryKey: ['admin', 'order', id], queryFn: () => adminApi.getOrder(id!), enabled: id !== null })
export const useAdminAccounts = (kind: AccountKind, q: PageParams) =>
  useQuery({
    queryKey: ['admin', kind, q],
    queryFn: () => (kind === 'customers' ? adminApi.listCustomers(q) : adminApi.listEmployees(q)),
    placeholderData: keepPreviousData,
  })

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

export function useSaveAccount(kind: AccountKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: AccountInput }) =>
      id ? adminApi.updateAccount(kind, id, input) : adminApi.createAccount(kind, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', kind] }),
  })
}

export function useDeleteAccount(kind: AccountKind) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.deleteAccount(kind, id),
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
