// API contract guessed from the JSP controllers + JPA entities (phase A REST /api/v1 is not merged yet).
// Everything marked "MATCH" must be re-checked against the real OpenAPI document.

export type CatalogKind = 'products' | 'foods'

// MATCH: Product and Food are two entities with the same shape; "type" differs (CAT|DOG vs DRY|SNACK|MILK|WET)
export interface CatalogItem {
  id: number
  name: string
  sortName: string
  price: number // VND, integer
  pic: string // file name under /img/product
  description: string
  type: string | null
}

export type CatalogInput = Omit<CatalogItem, 'id' | 'sortName'> & { sortName?: string }

// MATCH: Spring Data Page, flattened
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number // zero based
  size: number
}

export interface PageParams {
  page?: number
  size?: number
  q?: string
}

export interface CatalogQuery extends PageParams {
  sort?: 'price,asc' | 'price,desc'
}

export type OrderState = 'DUE' | 'PAID' | 'CANCEL'
export type PaymentMethod = 'COD' | 'ATM'

export interface OrderItem {
  id: number
  name: string
  quantity: number
  total: number
  type: 'FOOD' | 'PRODUCT'
}

export interface Order {
  id: number
  code: string
  label: string
  total: number
  state: OrderState
  note: string | null
  paymentMethod: PaymentMethod
  transactionDate: string // ISO-8601
  customerName?: string
  items?: OrderItem[]
}

export interface CreateOrderInput {
  items: { kind: CatalogKind; id: number; quantity: number }[]
  paymentMethod: PaymentMethod
  note?: string
}

// MATCH: identity comes from Keycloak; this is the local profile row (Customer entity)
export interface Profile {
  id: number
  username: string
  email: string
  fullName: string
  phone: string | null
  address: string | null
  birthday: string | null // yyyy-MM-dd
  avatarUrl: string
}

export type ProfileInput = Pick<Profile, 'fullName' | 'phone' | 'address' | 'birthday'>

export interface ContactInput {
  name: string
  email: string
  message: string
}

export interface Employee {
  id: number
  username: string
  fullName: string
  email: string
  phone: string | null
  role: 'Admin' | 'Moderator' | 'Write' | 'Read'
}

export type Customer = Profile & { orderCount: number; createdAt: string }

export interface AdminStats {
  totals: { revenue: number; orders: number; customers: number; items: number }
  revenueByDay: { date: string; revenue: number }[] // last 30 days
  ordersByState: { state: OrderState; count: number }[]
  topItems: { name: string; quantity: number; revenue: number }[]
}

export interface AdminOrderQuery extends PageParams {
  state?: OrderState
}
