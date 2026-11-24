import path from 'node:path'
import { expect, test } from '@playwright/test'
import { login, prefs, shot } from './helpers'

const NAME = `E2E Toy ${Date.now()}`

test.describe.configure({ mode: 'serial' })

test('demo-admin: create, edit and delete a product', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-admin', '/admin/products')
  await page.goto('/admin/products')
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await shot(page, '11-admin-products')

  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByLabel('Tên', { exact: true }).fill(NAME)
  await page.getByLabel(/Giá/).fill('123000')
  await page.getByTestId('image-input').setInputFiles(path.resolve('public/img/product/snack.jpg'))
  await page.getByLabel('Mô tả').fill('Created by Playwright')
  await page.waitForTimeout(300)
  await shot(page, '12-admin-product-form')
  await page.getByRole('button', { name: 'Lưu' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()

  await page.getByRole('textbox', { name: 'Tìm kiếm...' }).fill(NAME)
  const row = page.getByRole('row', { name: new RegExp(NAME) })
  await expect(row).toBeVisible()
  await expect(row).toContainText('123.000')
  await expect(row.locator('img')).toHaveAttribute('src', /\/photos\//)

  await row.getByRole('button', { name: 'Sửa' }).click()
  await page.getByLabel(/Giá/).fill('150000')
  await page.getByRole('button', { name: 'Lưu' }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(row).toContainText('150.000')

  await row.getByRole('button', { name: 'Xóa' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click()
  await expect(page.getByRole('row', { name: new RegExp(NAME) })).toHaveCount(0)
})

test('demo-admin: enters the admin from the shop header and goes back', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-admin')
  await page.getByRole('link', { name: 'Quản trị', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByText('Quản trị viên')).toBeVisible()
  await page.getByRole('link', { name: 'Về cửa hàng' }).click()
  await expect(page).toHaveURL('http://localhost:5173/')
})

test('demo-user: /admin shows no-permission page, not a blank page or a login loop', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-user')
  await page.goto('/admin')
  await expect(page.getByRole('heading', { name: 'Không có quyền' })).toBeVisible()
  await expect(page).toHaveURL(/\/admin$/)
})

test('demo-admin: filter orders and change an order state', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-admin', '/admin/orders')
  await page.goto('/admin/orders')
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await shot(page, '13-admin-orders')

  await page.getByRole('combobox', { name: 'Lọc trạng thái' }).click()
  await page.getByRole('option', { name: /Đang giao/ }).click()
  const first = page.getByRole('row').nth(1)
  await expect(first).toContainText('Đang giao')
  const code = (await first.getByRole('cell').first().innerText()).trim()
  await first.getByRole('button', { name: 'Xem chi tiết' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.waitForTimeout(400)
  await shot(page, '14-admin-order-detail')
  await page.getByRole('combobox', { name: 'Đổi trạng thái' }).click()
  await page.getByRole('option', { name: 'Thành công' }).click()
  await expect(page.getByText('Đã cập nhật trạng thái')).toBeVisible()
  await page.keyboard.press('Escape')

  await page.goto(`/admin/orders?q=${code}`)
  await expect(page.getByRole('row', { name: new RegExp(code) })).toContainText('Thành công')
})

test('demo-admin: accounts CRUD (customer and employee)', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-admin', '/admin/customers')
  await page.goto('/admin/customers')
  await expect(page.getByRole('row').nth(1)).toBeVisible()
  await shot(page, '15-admin-customers')

  for (const [path, label] of [['customers', 'Khách hàng'], ['employees', 'Nhân viên']] as const) {
    const username = `e2e-${path}-${Date.now()}`
    await page.goto(`/admin/${path}`)
    await expect(page.getByRole('heading', { name: label })).toBeVisible()
    await page.getByRole('button', { name: 'Thêm mới' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect(dialog.getByText('Bắt buộc')).toHaveCount(2)
    await dialog.getByLabel('Tài khoản').fill(username)
    await dialog.getByLabel('Họ và tên').fill('E2E Account')
    await dialog.getByLabel('Điện thoại').fill('0912345678')
    await dialog.getByRole('button', { name: 'Lưu' }).click()
    await expect(dialog).toBeHidden()

    await page.getByRole('textbox', { name: 'Tìm kiếm...' }).fill(username)
    const row = page.getByRole('row', { name: new RegExp(username) })
    await expect(row).toContainText('E2E Account')
    await row.getByRole('button', { name: 'Sửa' }).click()
    await page.getByLabel('Họ và tên').fill('E2E Renamed')
    await page.getByRole('button', { name: 'Lưu' }).click()
    await expect(row).toContainText('E2E Renamed')

    await row.getByRole('button', { name: 'Xóa' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Xóa' }).click()
    await expect(page.getByRole('row', { name: new RegExp(username) })).toHaveCount(0)
  }
})

test('demo-admin: upload limits and order lifecycle are enforced by the API (413, 415, 409)', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-admin', '/admin')
  await page.goto('/admin/products')
  await expect(page.getByRole('row').nth(1)).toBeVisible()

  // The UI refuses these files first; here they go straight to the API to prove the server refuses them too.
  const statuses = await page.evaluate(async () => {
    const { adminApi } = await import('/src/api/shop.ts')
    const { items } = await adminApi.listCatalog('products', { size: 1 })
    const id = items[0].id
    const attempt = async (file: File) => {
      try { await adminApi.uploadImage('products', id, file); return 200 } catch (e) { return (e as { status: number }).status }
    }
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
    return {
      wrongType: await attempt(new File(['<?php echo 1; ?>'], 'evil.png', { type: 'image/png' })),
      tooLarge: await attempt(new File([png, new Uint8Array(2 * 1024 * 1024 + 10)], 'big.png', { type: 'image/png' })),
    }
  })
  expect(statuses).toEqual({ wrongType: 415, tooLarge: 413 })

  // CANCEL is final: PAID -> DUE style moves answer 409
  const conflict = await page.evaluate(async () => {
    const { adminApi } = await import('/src/api/shop.ts')
    const { items } = await adminApi.listOrders({ state: 'CANCEL', size: 1 })
    try { await adminApi.setOrderState(items[0].id, 'PAID'); return 200 } catch (e) { return (e as { status: number }).status }
  })
  expect(conflict).toBe(409)
})

test('demo-admin: the UI rejects a bad image file with a clear message', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-admin', '/admin/products')
  await page.goto('/admin/products')
  await page.getByRole('button', { name: 'Thêm mới' }).click()
  await page.getByTestId('image-input').setInputFiles({ name: 'evil.png', mimeType: 'image/png', buffer: Buffer.from('<?php echo 1; ?>') })
  await expect(page.getByText('Chỉ nhận ảnh PNG, JPEG hoặc WebP.')).toBeVisible()
  await page.getByTestId('image-input').setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(2 * 1024 * 1024 + 10)]) })
  await expect(page.getByText('Ảnh quá lớn, tối đa 2 MB.')).toBeVisible()
})

// Last on purpose: the earlier tests mark today's order PAID (seed PAID orders are from 2020-21), giving the chart a data point.
test('demo-admin: dashboard has real numbers', async ({ page }) => {
  await prefs(page)
  await login(page, 'demo-admin', '/admin')
  await page.goto('/admin')
  await expect(page.getByTestId('kpi')).toHaveCount(4)
  const texts = await page.getByTestId('kpi').allInnerTexts()
  expect(texts.join(' ')).toMatch(/[1-9]/)
  await expect(page.locator('.recharts-line-curve')).toBeAttached()
  await page.waitForTimeout(1200)
  await shot(page, '10-admin-dashboard', true)
})
