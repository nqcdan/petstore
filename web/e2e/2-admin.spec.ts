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
