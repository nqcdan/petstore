import { del, get, patch, post, put, request } from './http'
import type {
  AdminOrderQuery,
  AdminStats,
  CatalogInput,
  CatalogItem,
  CatalogKind,
  CatalogQuery,
  ContactInput,
  CreateOrderInput,
  Customer,
  Employee,
  Order,
  OrderState,
  Page,
  PageParams,
  Profile,
  ProfileInput,
} from './types'

// Public + customer endpoints (MATCH with phase A: /api/v1/...)
export const shopApi = {
  listCatalog: (kind: CatalogKind, q: CatalogQuery) => get<Page<CatalogItem>>(`/${kind}`, { ...q }),
  sendContact: (input: ContactInput) => post<void>('/contacts', input),
  me: () => get<Profile>('/me'),
  updateMe: (input: ProfileInput) => put<Profile>('/me', input),
  uploadAvatar: (file: File) => {
    const form = new FormData()
    form.set('file', file)
    return request<Profile>('POST', '/me/avatar', { form })
  },
  myOrders: () => get<Order[]>('/orders'),
  myOrder: (id: number) => get<Order>(`/orders/${id}`),
  createOrder: (input: CreateOrderInput) => post<Order>('/orders', input),
}

// Admin endpoints (MATCH with phase A: /api/v1/admin/**, role admin)
export const adminApi = {
  stats: () => get<AdminStats>('/admin/stats'),
  listCatalog: (kind: CatalogKind, q: PageParams) => get<Page<CatalogItem>>(`/admin/${kind}`, { ...q }),
  createCatalog: (kind: CatalogKind, input: CatalogInput) => post<CatalogItem>(`/admin/${kind}`, input),
  updateCatalog: (kind: CatalogKind, id: number, input: CatalogInput) =>
    put<CatalogItem>(`/admin/${kind}/${id}`, input),
  deleteCatalog: (kind: CatalogKind, id: number) => del(`/admin/${kind}/${id}`),
  // returns the stored file name, to be put in CatalogInput.pic
  uploadImage: (file: File) => {
    const form = new FormData()
    form.set('file', file)
    return request<{ filename: string }>('POST', '/admin/uploads', { form })
  },
  listOrders: (q: AdminOrderQuery) => get<Page<Order>>('/admin/orders', { ...q }),
  getOrder: (id: number) => get<Order>(`/admin/orders/${id}`),
  setOrderState: (id: number, state: OrderState) => patch<Order>(`/admin/orders/${id}/state`, { state }),
  listCustomers: (q: PageParams) => get<Page<Customer>>('/admin/customers', { ...q }),
  listEmployees: (q: PageParams) => get<Page<Employee>>('/admin/employees', { ...q }),
}
