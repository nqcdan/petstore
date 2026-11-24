import type { CatalogItem, CatalogKind, Customer, Employee, Order, OrderItem, OrderState, PaymentMethod, Profile } from '@/api/types'
import seed from './seed.json'

// Deterministic PRNG so screenshots and tests are stable.
function rng(seedValue: number) {
  let s = seedValue
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '')

interface Db {
  catalog: Record<CatalogKind, CatalogItem[]>
  orders: (Order & { customerId: number })[]
  customers: Customer[]
  employees: Employee[]
  nextId: number
}

const names = ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Nam', 'Phạm Minh Châu', 'Võ Thanh Dũng', 'Đặng Ngọc Hà', 'Bùi Quốc Huy', 'Hoàng Thu Trang', 'Đỗ Gia Bảo', 'Ngô Phương Linh', 'Dương Tuấn Kiệt', 'Lý Mỹ Duyên']

function build(): Db {
  const rand = rng(42)
  const catalog: Db['catalog'] = {
    products: seed.products.map((p) => ({ ...p, sortName: p.sortName ?? slug(p.name) })),
    foods: seed.foods.map((p) => ({ ...p, sortName: p.sortName ?? slug(p.name) })),
  }
  const customers: Customer[] = names.map((fullName, i) => ({
    id: i + 1,
    username: `user${i + 1}`,
    email: `${slug(fullName).toLowerCase().replace(/-/g, '.')}@example.com`,
    fullName,
    phone: `09${String(10000000 + Math.floor(rand() * 89999999))}`,
    address: `${10 + i} Nguyễn Huệ, Quận 1, TP.HCM`,
    birthday: `199${i % 10}-0${(i % 9) + 1}-1${i % 9}`,
    avatarUrl: 'customer-default.jpg',
    orderCount: 0,
    createdAt: new Date(Date.UTC(2025, i % 12, 5 + i)).toISOString(),
  }))
  // customer #1 is the demo "customer" login
  customers[0] = { ...customers[0], email: 'an.nguyen@example.com' }

  const all = [...catalog.products, ...catalog.foods]
  const orders: Db['orders'] = []
  const states: OrderState[] = ['PAID', 'PAID', 'PAID', 'DUE', 'CANCEL']
  const today = new Date()
  for (let i = 0; i < 90; i++) {
    const daysAgo = Math.floor(rand() * 30)
    const date = new Date(today.getTime() - daysAgo * 86400000 - Math.floor(rand() * 40000000))
    const customer = customers[Math.floor(rand() * customers.length)]
    const lines = 1 + Math.floor(rand() * 3)
    const items: OrderItem[] = []
    for (let l = 0; l < lines; l++) {
      const it = all[Math.floor(rand() ** 1.6 * all.length)]
      const quantity = 1 + Math.floor(rand() * 3)
      items.push({ id: i * 10 + l, name: it.name, quantity, total: it.price * quantity, type: catalog.foods.includes(it) ? 'FOOD' : 'PRODUCT' })
    }
    orders.push({
      id: i + 1,
      code: `order_${516 + i * 37}`,
      label: `order-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${i + 1}`,
      total: items.reduce((s, x) => s + x.total, 0),
      state: states[Math.floor(rand() * states.length)],
      note: `Order for ${customer.fullName}`,
      paymentMethod: (rand() > 0.4 ? 'COD' : 'ATM') as PaymentMethod,
      transactionDate: date.toISOString(),
      customerName: customer.fullName,
      customerId: customer.id,
      items,
    })
    customer.orderCount++
  }
  orders.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  const roles: Employee['role'][] = ['Admin', 'Moderator', 'Write', 'Write', 'Read', 'Read']
  const employees: Employee[] = roles.map((role, i) => ({
    id: i + 1,
    username: `staff${i + 1}`,
    fullName: names[(i + 5) % names.length],
    email: `staff${i + 1}@pets.example.com`,
    phone: `08${String(10000000 + Math.floor(rand() * 89999999))}`,
    role,
  }))
  return { catalog, orders, customers, employees, nextId: 5000 }
}

export let db = build()
export const resetDb = () => {
  db = build()
}

export const MOCK_ME_ID = 1
export const profileOf = (c: Customer): Profile => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { orderCount: _o, createdAt: _c, ...profile } = c
  return profile
}
