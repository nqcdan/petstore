import { http, HttpResponse, type HttpHandler } from 'msw'
import { API_BASE } from '@/api/http'
import type {
  AdminStats, CatalogInput, CatalogItem, CatalogKind, ContactInput, CreateOrderInput, Order, OrderState, Page, ProfileInput,
} from '@/api/types'
import { db, MOCK_ME_ID, profileOf } from './db'

const url = (p: string) => `${API_BASE}${p}`
const role = () => localStorage.getItem('petstore.mock-user')

const unauthorized = () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
const forbidden = () => HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
const notFound = () => HttpResponse.json({ message: 'Not found' }, { status: 404 })

function paginate<T>(rows: T[], params: URLSearchParams): Page<T> {
  const size = Number(params.get('size') ?? 12)
  const page = Number(params.get('page') ?? 0)
  return { content: rows.slice(page * size, page * size + size), totalElements: rows.length, totalPages: Math.max(1, Math.ceil(rows.length / size)), page, size }
}

const matches = (q: string | null, ...fields: (string | null | undefined)[]) =>
  !q || fields.some((f) => f?.toLowerCase().includes(q.toLowerCase()))

function listCatalog(kind: CatalogKind, params: URLSearchParams) {
  const q = params.get('q')
  let rows = db.catalog[kind].filter((i) => matches(q, i.name))
  const sort = params.get('sort')
  if (sort === 'price,asc') rows = [...rows].sort((a, b) => a.price - b.price)
  if (sort === 'price,desc') rows = [...rows].sort((a, b) => b.price - a.price)
  return HttpResponse.json(paginate(rows, params))
}

const withAdmin = <A extends unknown[]>(fn: (...args: A) => Response | Promise<Response>) => (...args: A) =>
  role() === null ? unauthorized() : role() !== 'admin' ? forbidden() : fn(...args)
const withUser = <A extends unknown[]>(fn: (...args: A) => Response | Promise<Response>) => (...args: A) =>
  role() === null ? unauthorized() : fn(...args)

function stats(): AdminStats {
  const live = db.orders.filter((o) => o.state !== 'CANCEL')
  const days = new Map<string, number>()
  for (let i = 29; i >= 0; i--) days.set(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10), 0)
  for (const o of live) {
    const d = o.transactionDate.slice(0, 10)
    if (days.has(d)) days.set(d, (days.get(d) ?? 0) + o.total)
  }
  const top = new Map<string, { quantity: number; revenue: number }>()
  for (const o of live) for (const it of o.items ?? []) {
    const cur = top.get(it.name) ?? { quantity: 0, revenue: 0 }
    top.set(it.name, { quantity: cur.quantity + it.quantity, revenue: cur.revenue + it.total })
  }
  return {
    totals: { revenue: live.reduce((s, o) => s + o.total, 0), orders: db.orders.length, customers: db.customers.length, items: db.catalog.products.length + db.catalog.foods.length },
    revenueByDay: [...days].map(([date, revenue]) => ({ date, revenue })),
    ordersByState: (['PAID', 'DUE', 'CANCEL'] as OrderState[]).map((state) => ({ state, count: db.orders.filter((o) => o.state === state).length })),
    topItems: [...top].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5),
  }
}

const stripCustomerId = ({ customerId: _c, ...o }: Order & { customerId: number }): Order => o // eslint-disable-line @typescript-eslint/no-unused-vars
const summary = (o: Order): Order => ({ ...o, items: undefined })

const catalogAdmin = (kind: CatalogKind): HttpHandler[] => [
  http.get(url(`/admin/${kind}`), withAdmin(({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get('q')
    return HttpResponse.json(paginate(db.catalog[kind].filter((i) => matches(q, i.name)), params))
  })),
  http.post(url(`/admin/${kind}`), withAdmin(async ({ request }) => {
    const input = (await request.json()) as CatalogInput
    const item: CatalogItem = { ...input, id: db.nextId++, sortName: input.sortName ?? input.name.replace(/\s+/g, '-') }
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
]

export const handlers: HttpHandler[] = [
  http.get(url('/products'), ({ request }) => listCatalog('products', new URL(request.url).searchParams)),
  http.get(url('/foods'), ({ request }) => listCatalog('foods', new URL(request.url).searchParams)),
  http.post(url('/contacts'), async ({ request }) => {
    const c = (await request.json()) as ContactInput
    return c.email && c.message ? new HttpResponse(null, { status: 204 }) : HttpResponse.json({ message: 'Invalid' }, { status: 400 })
  }),

  http.get(url('/me'), withUser(() => HttpResponse.json(profileOf(db.customers[MOCK_ME_ID - 1])))),
  http.put(url('/me'), withUser(async ({ request }) => {
    const input = (await request.json()) as ProfileInput
    db.customers[MOCK_ME_ID - 1] = { ...db.customers[MOCK_ME_ID - 1], ...input }
    return HttpResponse.json(profileOf(db.customers[MOCK_ME_ID - 1]))
  })),
  http.post(url('/me/avatar'), withUser(() => HttpResponse.json(profileOf(db.customers[MOCK_ME_ID - 1])))),

  http.get(url('/orders'), withUser(() =>
    HttpResponse.json(db.orders.filter((o) => o.customerId === MOCK_ME_ID).map((o) => summary(stripCustomerId(o)))))),
  http.get(url('/orders/:id'), withUser(({ params }) => {
    const o = db.orders.find((x) => x.id === Number(params.id) && x.customerId === MOCK_ME_ID)
    return o ? HttpResponse.json(stripCustomerId(o)) : notFound()
  })),
  http.post(url('/orders'), withUser(async ({ request }) => {
    const input = (await request.json()) as CreateOrderInput
    const items = input.items.flatMap((l) => {
      const it = db.catalog[l.kind].find((c) => c.id === l.id)
      return it ? [{ id: db.nextId++, name: it.name, quantity: l.quantity, total: it.price * l.quantity, type: l.kind === 'foods' ? ('FOOD' as const) : ('PRODUCT' as const) }] : []
    })
    const me = db.customers[MOCK_ME_ID - 1]
    const order = {
      id: db.nextId++, code: `order_${Math.floor(500 + Math.random() * 59000)}`, label: `order-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
      total: items.reduce((s, i) => s + i.total, 0), state: 'DUE' as const, note: input.note || `Order for ${me.fullName}`, paymentMethod: input.paymentMethod,
      transactionDate: new Date().toISOString(), customerName: me.fullName, customerId: me.id, items,
    }
    db.orders.unshift(order)
    return HttpResponse.json(stripCustomerId(order), { status: 201 })
  })),

  http.get(url('/admin/stats'), withAdmin(() => HttpResponse.json(stats()))),
  ...catalogAdmin('products'),
  ...catalogAdmin('foods'),
  http.post(url('/admin/uploads'), withAdmin(() => HttpResponse.json({ filename: 'snack.jpg' }))),
  http.get(url('/admin/orders'), withAdmin(({ request }) => {
    const params = new URL(request.url).searchParams
    const state = params.get('state'), q = params.get('q')
    const rows = db.orders.filter((o) => (!state || o.state === state) && matches(q, o.code, o.customerName))
    return HttpResponse.json(paginate(rows.map((o) => summary(stripCustomerId(o))), params))
  })),
  http.get(url('/admin/orders/:id'), withAdmin(({ params }) => {
    const o = db.orders.find((x) => x.id === Number(params.id))
    return o ? HttpResponse.json(stripCustomerId(o)) : notFound()
  })),
  http.patch(url('/admin/orders/:id/state'), withAdmin(async ({ request, params }) => {
    const o = db.orders.find((x) => x.id === Number(params.id))
    if (!o) return notFound()
    o.state = ((await request.json()) as { state: OrderState }).state
    return HttpResponse.json(stripCustomerId(o))
  })),
  http.get(url('/admin/customers'), withAdmin(({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get('q')
    return HttpResponse.json(paginate(db.customers.filter((c) => matches(q, c.fullName, c.email, c.username)), params))
  })),
  http.get(url('/admin/employees'), withAdmin(({ request }) => {
    const params = new URL(request.url).searchParams
    const q = params.get('q')
    return HttpResponse.json(paginate(db.employees.filter((e) => matches(q, e.fullName, e.email, e.username)), params))
  })),
]
