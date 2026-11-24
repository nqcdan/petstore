import type { Account, CatalogItem, CatalogKind, OrderDetail, OrderState } from '@/api/types'
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
  orders: OrderDetail[]
  customers: Account[]
  employees: Account[]
  nextId: number
}

const names = ['Nguyễn Văn An', 'Trần Thị Bích', 'Lê Hoàng Nam', 'Phạm Minh Châu', 'Võ Thanh Dũng', 'Đặng Ngọc Hà', 'Bùi Quốc Huy', 'Hoàng Thu Trang', 'Đỗ Gia Bảo', 'Ngô Phương Linh', 'Dương Tuấn Kiệt', 'Lý Mỹ Duyên']

function build(): Db {
  const rand = rng(42)
  const catalog: Db['catalog'] = {
    products: seed.products.map((p) => ({ ...p, sortName: p.sortName ?? slug(p.name) })),
    foods: seed.foods.map((p) => ({ ...p, sortName: p.sortName ?? slug(p.name) })),
  }
  const customers: Account[] = names.map((fullName, i) => ({
    id: i + 1,
    username: i === 0 ? 'demo-user' : `user${i + 1}`,
    fullName,
    email: `${slug(fullName).toLowerCase().replace(/-/g, '.')}@example.com`,
    phone: `09${String(10000000 + Math.floor(rand() * 89999999))}`,
    address: `${10 + i} Nguyễn Huệ, Quận 1, TP.HCM`,
    gender: i % 2 ? 'Female' : 'Male',
    role: null,
    birthday: `199${i % 10}-0${(i % 9) + 1}-1${i % 9}`,
    verified: i % 4 !== 3,
  }))

  const all = [...catalog.products.map((x) => ({ x, type: 'PRODUCT' })), ...catalog.foods.map((x) => ({ x, type: 'FOOD' }))]
  const orders: Db['orders'] = []
  const states: OrderState[] = ['PAID', 'PAID', 'PAID', 'DUE', 'CANCEL']
  const today = new Date()
  for (let i = 0; i < 90; i++) {
    const date = new Date(today.getTime() - Math.floor(rand() * 30) * 86400000 - Math.floor(rand() * 40000000))
    const customer = customers[Math.floor(rand() * customers.length)]
    const items = Array.from({ length: 1 + Math.floor(rand() * 3) }, () => {
      const { x, type } = all[Math.floor(rand() ** 1.6 * all.length)]
      const quantity = 1 + Math.floor(rand() * 3)
      return { name: x.name, type, quantity, total: x.price * quantity }
    })
    orders.push({
      id: i + 1,
      code: `order_${516 + i * 37}`,
      state: states[Math.floor(rand() * states.length)],
      total: items.reduce((s, x) => s + x.total, 0),
      currency: 'VND',
      transactionDate: date.toISOString(),
      customerName: customer.fullName,
      customerUsername: customer.username,
      employeeUsername: null,
      note: `Order for ${customer.fullName}`,
      items,
    })
  }
  orders.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))

  const roles: NonNullable<Account['role']>[] = ['Admin', 'Moderator', 'Write', 'Write', 'Read', 'Read']
  const employees: Account[] = roles.map((role, i) => ({
    id: i + 1,
    username: `staff${i + 1}`,
    fullName: names[(i + 5) % names.length],
    email: `staff${i + 1}@pets.example.com`,
    phone: `08${String(10000000 + Math.floor(rand() * 89999999))}`,
    address: null,
    gender: null,
    role,
    birthday: null,
    verified: true,
  }))
  return { catalog, orders, customers, employees, nextId: 5000 }
}

export let db = build()
export const resetDb = () => {
  db = build()
}

export const MOCK_USERNAME = 'demo-user'
