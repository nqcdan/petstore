// Shapes of the PetStore REST API (/api/v1), mirrored from Dto.java on branch dan-petstore-modernize.
// src/api/schema.d.ts is generated from the live OpenAPI document (pnpm gen:api); contract.ts checks these against it.

export type CatalogKind = 'products' | 'foods'

export interface CatalogItem {
  id: number
  name: string
  sortName: string
  price: number // VND, integer
  imageUrl: string | null // "/img/product/x.jpg" (bundled) or "/user-photos/..." (uploaded)
  description: string | null
  type: string | null
}

export interface CatalogInput {
  name: string
  sortName?: string
  price: number
  description: string
  type: string
}

// Zero-based page, same for every list endpoint.
export interface Page<T> {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export interface PageParams {
  page?: number
  size?: number
  q?: string
  sort?: string // "price,asc"
}

export interface CatalogQuery extends PageParams {
  type?: string
}

export type OrderState = 'DUE' | 'PAID' | 'CANCEL'

export interface OrderItem {
  name: string
  type: string // FOOD | PRODUCT
  quantity: number
  total: number
}

export interface OrderSummary {
  id: number
  code: string
  state: OrderState
  total: number
  currency: string
  transactionDate: string // ISO-8601 instant
  customerName: string | null
}

export interface OrderDetail extends OrderSummary {
  customerUsername: string | null
  employeeUsername: string | null
  note: string | null
  items: OrderItem[]
}

export interface CartLine {
  type: 'FOOD' | 'PRODUCT'
  id: number
  quantity: number
}

export interface OrderRequest {
  items: CartLine[]
  note?: string
}

export interface Me {
  subject: string
  username: string
  email: string | null
  name: string | null
  roles: string[]
}

export interface Account {
  id: number
  username: string
  fullName: string
  email: string | null
  phone: string | null
  address: string | null
  gender: 'Male' | 'Female' | null
  role: 'Admin' | 'Moderator' | 'Write' | 'Read' | null
  birthday: string | null
  verified: boolean
}

export interface AdminStats {
  revenueByDay: { date: string; orders: number; revenue: number }[] // last 30 days, PAID orders only
  ordersByState: { state: OrderState; count: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  totalCustomers: number
}

export interface AdminOrderQuery extends PageParams {
  state?: OrderState
}

export interface ContactInput {
  name: string
  email: string
  message: string
}
