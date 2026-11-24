import { CONTACT_PATH } from './urls'
import { del, get, patch, post, put, request } from './http'
import type {
  Account, AccountInput, AccountKind, AdminOrderQuery, AdminStats, CatalogInput, CatalogItem, CatalogKind, CatalogQuery, ContactInput, Me, OrderDetail,
  OrderRequest, OrderState, OrderSummary, Page, PageParams,
} from './types'

// Public + customer endpoints
export const shopApi = {
  listCatalog: (kind: CatalogKind, q: CatalogQuery) => get<Page<CatalogItem>>(`/${kind}`, { ...q }),
  me: () => get<Me>('/me'),
  myOrders: () => get<Page<OrderSummary>>('/orders', { size: 100 }),
  myOrder: (code: string) => get<OrderDetail>(`/orders/${encodeURIComponent(code)}`),
  createOrder: (input: OrderRequest) => post<OrderDetail>('/orders', input),
  sendContact: (input: ContactInput) => post<void>(CONTACT_PATH, input),
}

// Admin endpoints (role admin)
export const adminApi = {
  stats: () => get<AdminStats>('/admin/stats'),
  listCatalog: (kind: CatalogKind, q: PageParams & { type?: string }) => get<Page<CatalogItem>>(`/admin/${kind}`, { ...q }),
  createCatalog: (kind: CatalogKind, input: CatalogInput) => post<CatalogItem>(`/admin/${kind}`, input),
  updateCatalog: (kind: CatalogKind, id: number, input: CatalogInput) => put<CatalogItem>(`/admin/${kind}/${id}`, input),
  deleteCatalog: (kind: CatalogKind, id: number) => del(`/admin/${kind}/${id}`),
  // image belongs to an existing item, so a new item is created first
  uploadImage: (kind: CatalogKind, id: number, file: File) => {
    const form = new FormData()
    form.set('file', file)
    return request<CatalogItem>('POST', `/admin/${kind}/${id}/image`, { form })
  },
  listOrders: (q: AdminOrderQuery) => get<Page<OrderSummary>>('/admin/orders', { ...q }),
  getOrder: (id: number) => get<OrderDetail>(`/admin/orders/${id}`),
  setOrderState: (id: number, state: OrderState) => patch<OrderDetail>(`/admin/orders/${id}/state`, { state }),
  listCustomers: (q: PageParams) => get<Page<Account>>('/admin/customers', { ...q }),
  listEmployees: (q: PageParams) => get<Page<Account>>('/admin/employees', { ...q }),
  createAccount: (kind: AccountKind, input: AccountInput) => post<Account>(`/admin/${kind}`, input),
  updateAccount: (kind: AccountKind, id: number, input: AccountInput) => put<Account>(`/admin/${kind}/${id}`, input),
  deleteAccount: (kind: AccountKind, id: number) => del(`/admin/${kind}/${id}`),
}
