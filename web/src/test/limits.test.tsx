import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { errorMessage } from '@/api/errors'
import { ApiError } from '@/api/http'
import { adminApi, shopApi } from '@/api/shop'
import type { CatalogItem } from '@/api/types'
import { CartProvider } from '@/cart/CartProvider'
import { useCart } from '@/cart/context'
import i18n from '@/i18n'
import { checkImage } from '@/lib/image'
import { MAX_ORDER_LINES, MAX_QUANTITY } from '@/lib/limits'
import { canMove } from '@/lib/orderState'
import { resetDb } from '@/mocks/db'

beforeEach(async () => {
  localStorage.clear()
  resetDb()
  await i18n.changeLanguage('vi')
})

describe('error messages', () => {
  it.each([
    [400, 'Dữ liệu không hợp lệ: Quantity is limited', 'Invalid data: Quantity is limited'],
    [409, /xung đột/, /conflicts/],
    [413, 'Ảnh quá lớn, tối đa 2 MB.', 'The image is too large, 2 MB at most.'],
    [415, 'Chỉ nhận ảnh PNG, JPEG hoặc WebP.', 'Only PNG, JPEG or WebP images are accepted.'],
  ])('maps %i in both languages', async (status, vi, en) => {
    const e = new ApiError(status, 'Quantity is limited')
    expect(errorMessage(e)).toMatch(vi as string | RegExp)
    await i18n.changeLanguage('en')
    expect(errorMessage(e)).toMatch(en as string | RegExp)
  })

  it('treats a failed fetch as a network error', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toContain('Không kết nối được máy chủ')
  })
})

describe('image check before upload', () => {
  const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
  it('accepts a real PNG and rejects other content or oversize files', async () => {
    expect(await checkImage(new File([png], 'a.png', { type: 'image/png' }))).toBeNull()
    expect(await checkImage(new File(['<?php echo 1 ?>'], 'evil.png', { type: 'image/png' }))).toBe('type')
    expect(await checkImage(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }))).toBe('size')
  })
})

describe('cart limits', () => {
  const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>
  let item: CatalogItem
  beforeEach(async () => {
    item = (await shopApi.listCatalog('products', { size: 60 })).items[0]
  })

  it('caps the quantity per line at the server limit', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    act(() => { result.current.add('products', item) })
    act(() => result.current.setQuantity('products', item.id, 999))
    expect(result.current.lines[0].quantity).toBe(MAX_QUANTITY)
    let r = ''
    act(() => { r = result.current.add('products', item) })
    expect(r).toBe('quantity')
  })

  it('refuses a new line beyond the maximum number of lines', async () => {
    const products = (await shopApi.listCatalog('products', { size: 100 })).items
    const foods = (await shopApi.listCatalog('foods', { size: 100 })).items
    const { result } = renderHook(() => useCart(), { wrapper })
    for (const it of products) act(() => { result.current.add('products', it) })
    for (const it of foods.slice(0, MAX_ORDER_LINES - products.length)) act(() => { result.current.add('foods', it) })
    expect(result.current.lines).toHaveLength(MAX_ORDER_LINES)
    let r = ''
    act(() => { r = result.current.add('foods', foods[MAX_ORDER_LINES - products.length]) })
    expect(r).toBe('lines')
  })
})

describe('order lifecycle', () => {
  it('only allows DUE -> PAID|CANCEL and PAID -> CANCEL', () => {
    expect(canMove('DUE', 'PAID')).toBe(true)
    expect(canMove('PAID', 'CANCEL')).toBe(true)
    expect(canMove('PAID', 'DUE')).toBe(false)
    expect(canMove('CANCEL', 'PAID')).toBe(false)
  })

  it('mock API answers 409 like the backend', async () => {
    localStorage.setItem('petstore.mock-user', 'admin')
    const { items } = await adminApi.listOrders({ state: 'CANCEL', size: 1 })
    await expect(adminApi.setOrderState(items[0].id, 'PAID')).rejects.toMatchObject({ status: 409 })
  })
})
