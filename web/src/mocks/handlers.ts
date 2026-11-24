import { http, HttpResponse, type HttpHandler } from 'msw'
import { API_BASE } from '@/api/http'
import type { Account, AccountInput, AccountKind, AdminStats, CatalogInput, CatalogItem, CatalogKind, OrderDetail, OrderRequest, OrderState, OrderSummary, Page } from '@/api/types'
import { CONTACT_PATH } from '@/api/urls'
import { MAX_ORDER_LINES, MAX_QUANTITY } from '@/lib/limits'
import { canMove } from '@/lib/orderState'
import { db, MOCK_USERNAME } from './db'

// Mirrors the real /api/v1 contract (see src/api/types.ts); used for dev without a backend and for unit tests.
const url = (p: string) => `${API_BASE}${p}`
const role = () => localStorage.getItem('petstore.mock-user')

const unauthorized = () => HttpResponse.json({ title: 'Unauthorized', detail: 'Unauthorized' }, { status: 401 })
const forbidden = () => HttpResponse.json({ title: 'Forbidden', detail: 'Forbidden' }, { status: 403 })
const notFound = () => HttpResponse.json({ title: 'Not Found', detail: 'Not found' }, { status: 404 })

function paginate<T>(rows: T[], params: URLSearchParams, defaultSize = 20): Page<T> {
  const size = Number(params.get('size') ?? defaultSize)
  const page = Number(params.get('page') ?? 0)
  return { items: rows.slice(page * size, page * size + size), page, size, totalItems: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / size)) }
}

const matches = (q: string | null, ...fields: (string | null | undefined)[]) =>
  !q || fields.some((f) => f?.toLowerCase().includes(q.toLowerCase()))

function filterCatalog(kind: CatalogKind, params: URLSearchParams) {
  const q = params.get('q'), type = params.get('type')
  let rows = db.catalog[kind].filter((i) => matches(q, i.name) && (!type || i.type === type))
  const sort = params.get('sort')
  if (sort === 'price,asc') rows = [...rows].sort((a, b) => a.price - b.price)
  if (sort === 'price,desc') rows = [...rows].sort((a, b) => b.price - a.price)
  return rows
}

const withAdmin = <A extends unknown[]>(fn: (...args: A) => Response | Promise<Response>) => (...args: A) =>
  role() === null ? unauthorized() : role() !== 'admin' ? forbidden() : fn(...args)
const withUser = <A extends unknown[]>(fn: (...args: A) => Response | Promise<Response>) => (...args: A) =>
  role() === null ? unauthorized() : fn(...args)

function stats(): AdminStats {
  const paid = db.orders.filter((o) => o.state === 'PAID')
  const days = new Map<string, { orders: number; revenue: number }>()
  for (let i = 29; i >= 0; i--) days.set(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), { orders: 0, revenue: 0 })
  for (const o of paid) {
    const d = days.get(o.transactionDate.slice(0, 10))
    if (d) { d.orders++; d.revenue += o.total }
  }
  const top = new Map<string, { quantity: number; revenue: number }>()
  for (const o of paid) for (const it of o.items) {
    const cur = top.get(it.name) ?? { quantity: 0, revenue: 0 }
    top.set(it.name, { quantity: cur.quantity + it.quantity, revenue: cur.revenue + it.total })
  }
  return {
    revenueByDay: [...days].map(([date, v]) => ({ date, ...v })),
    ordersByState: (['PAID', 'DUE', 'CANCEL'] as OrderState[]).map((state) => ({ state, count: db.orders.filter((o) => o.state === state).length })),
    topProducts: [...top].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
    totalCustomers: db.customers.length,
  }
}

const summary = ({ id, code, state, total, currency, paymentMethod, transactionDate, customerName }: OrderDetail): OrderSummary =>
  ({ id, code, state, total, currency, paymentMethod, transactionDate, customerName })

const catalogAdmin = (kind: CatalogKind): HttpHandler[] => [
  http.get(url(`/admin/${kind}`), withAdmin(({ request }) => HttpResponse.json(paginate(filterCatalog(kind, new URL(request.url).searchParams), new URL(request.url).searchParams)))),
  http.post(url(`/admin/${kind}`), withAdmin(async ({ request }) => {
    const input = (await request.json()) as CatalogInput
    const item: CatalogItem = { ...input, id: db.nextId++, sortName: input.sortName ?? input.name.replace(/\s+/g, '-'), imageUrl: '/img/product/snack.jpg' }
    db.catalog[kind].unshift(item)
    return HttpResponse.json(item, { status: 201 })
  })),
  http.put(url(`/admin/${kind}/:id`), withAdmin(async ({ request, params }) => {
    const idx = db.catalog[kind].findIndex((i) => i.id === Number(params.id))
    if (idx < 0) return notFound()
    db.catalog[kind][idx] = { ...db.catalog[kind][idx], ...((await request.json()) as CatalogInput) }
    return HttpResponse.json(db.catalog[kind][idx])
  })),
  http.delete(url(`/admin/${kind}/:id`), withAdmin(({ params }) => {
    db.catalog[kind] = db.catalog[kind].filter((i) => i.id !== Number(params.id))
    return new HttpResponse(null, { status: 204 })
  })),
  http.post(url(`/admin/${kind}/:id/image`), withAdmin(({ params }) => {
    const item = db.catalog[kind].find((i) => i.id === Number(params.id))
    return item ? HttpResponse.json(item) : notFound()
  })),
]

const accountAdmin = (kind: AccountKind): HttpHandler[] => [
  http.get(url(`/admin/${kind}`), withAdmin(({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get('q')
    return HttpResponse.json(paginate(db[kind].filter((c) => matches(q, c.fullName, c.email, c.username)), params))
  })),
  http.post(url(`/admin/${kind}`), withAdmin(async ({ request }) => {
    const input = (await request.json()) as AccountInput
    if (db[kind].some((a) => a.username === input.username)) return HttpResponse.json({ title: 'Conflict', detail: 'The change conflicts with existing data' }, { status: 409 })
    const account: Account = { gender: null, role: null, email: null, phone: null, address: null, birthday: null, ...input, id: db.nextId++, verified: false } as Account
    db[kind].unshift(account)
    return HttpResponse.json(account, { status: 201 })
  })),
  http.put(url(`/admin/${kind}/:id`), withAdmin(async ({ request, params }) => {
    const idx = db[kind].findIndex((a) => a.id === Number(params.id))
    if (idx < 0) return notFound()
    db[kind][idx] = { ...db[kind][idx], ...((await request.json()) as AccountInput) } as Account
    return HttpResponse.json(db[kind][idx])
  })),
  http.delete(url(`/admin/${kind}/:id`), withAdmin(({ params }) => {
    db[kind] = db[kind].filter((a) => a.id !== Number(params.id))
    return new HttpResponse(null, { status: 204 })
  })),
]

export const handlers: HttpHandler[] = [
  http.get(url('/products'), ({ request }) => HttpResponse.json(paginate(filterCatalog('products', new URL(request.url).searchParams), new URL(request.url).searchParams))),
  http.get(url('/foods'), ({ request }) => HttpResponse.json(paginate(filterCatalog('foods', new URL(request.url).searchParams), new URL(request.url).searchParams))),
  http.post(url(CONTACT_PATH), () => new HttpResponse(null, { status: 204 })),

  http.get(url('/me'), withUser(() => {
    const admin = role() === 'admin'
    return HttpResponse.json({
      subject: admin ? 'mock-admin' : 'mock-user', username: admin ? 'demo-admin' : MOCK_USERNAME,
      email: admin ? 'bich.tran@example.com' : 'an.nguyen@example.com', name: admin ? 'Trần Thị Bích' : 'Nguyễn Văn An',
      roles: admin ? ['admin', 'customer'] : ['customer'],
    })
  })),
  http.get(url('/orders'), withUser(({ request }) =>
    HttpResponse.json(paginate(db.orders.filter((o) => o.customerUsername === MOCK_USERNAME).map(summary), new URL(request.url).searchParams)))),
  http.get(url('/orders/:code'), withUser(({ params }) => {
    const o = db.orders.find((x) => x.code === params.code && x.customerUsername === MOCK_USERNAME)
    return o ? HttpResponse.json(o) : notFound()
  })),
  http.post(url('/orders'), withUser(async ({ request }) => {
    const input = (await request.json()) as OrderRequest
    if (input.items.length > MAX_ORDER_LINES || input.items.some((l) => l.quantity < 1 || l.quantity > MAX_QUANTITY)) return HttpResponse.json({ title: 'Bad Request', detail: 'Quantity is limited' }, { status: 400 })
    const items = input.items.flatMap((l) => {
      const it = db.catalog[l.type === 'FOOD' ? 'foods' : 'products'].find((c) => c.id === l.id)
      return it ? [{ name: it.name, type: l.type, quantity: l.quantity, total: it.price * l.quantity }] : []
    })
    const me = db.customers[0]
    const order: OrderDetail = {
      id: db.nextId++, code: `order_${Math.floor(500 + Math.random() * 59000)}`, state: 'DUE', total: items.reduce((s, i) => s + i.total, 0), currency: 'VND', paymentMethod: input.paymentMethod ?? 'COD',
      transactionDate: new Date().toISOString(), customerName: me.fullName, customerUsername: MOCK_USERNAME, employeeUsername: null,
      note: input.note || `Order for ${me.fullName}`, items,
    }
    db.orders.unshift(order)
    return HttpResponse.json(order, { status: 201 })
  })),

  http.get(url('/admin/stats'), withAdmin(() => HttpResponse.json(stats()))),
  ...catalogAdmin('products'),
  ...catalogAdmin('foods'),
  http.get(url('/admin/orders'), withAdmin(({ request }) => {
    const params = new URL(request.url).searchParams
    const state = params.get('state'), q = params.get('q')
    return HttpResponse.json(paginate(db.orders.filter((o) => (!state || o.state === state) && matches(q, o.code, o.customerName)).map(summary), params))
  })),
  http.get(url('/admin/orders/:id'), withAdmin(({ params }) => {
    const o = db.orders.find((x) => x.id === Number(params.id))
    return o ? HttpResponse.json(o) : notFound()
  })),
  http.patch(url('/admin/orders/:id/state'), withAdmin(async ({ request, params }) => {
    const o = db.orders.find((x) => x.id === Number(params.id))
    if (!o) return notFound()
    const next = ((await request.json()) as { state: OrderState }).state
    if (!canMove(o.state, next)) return HttpResponse.json({ title: 'Conflict', detail: `An order cannot go from ${o.state} to ${next}` }, { status: 409 })
    o.state = next
    return HttpResponse.json(o)
  })),
  ...accountAdmin('customers'),
  ...accountAdmin('employees'),
]
