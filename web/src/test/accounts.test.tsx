import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { CustomersPage, EmployeesPage } from '@/admin/People'
import { shopApi } from '@/api/shop'
import { imgUrl } from '@/api/urls'
import { resetDb } from '@/mocks/db'
import i18n from '@/i18n'
import { renderAt } from './utils'

beforeEach(async () => {
  localStorage.clear()
  localStorage.setItem('petstore.mock-user', 'admin')
  resetDb()
  await i18n.changeLanguage('vi')
})

const page = (
  <Routes>
    <Route path="/admin/customers" element={<CustomersPage />} />
    <Route path="/admin/employees" element={<EmployeesPage />} />
  </Routes>
)

describe('admin accounts CRUD', () => {
  it('validates, creates, edits and deletes an employee', async () => {
    const user = userEvent.setup()
    renderAt(page, '/admin/employees')
    await screen.findByText('staff1')

    await user.click(screen.getByRole('button', { name: 'Thêm mới' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    expect(await within(dialog).findAllByText('Bắt buộc')).toHaveLength(2)

    await user.type(within(dialog).getByLabelText('Tài khoản'), 'newstaff')
    await user.type(within(dialog).getByLabelText('Họ và tên'), 'Nhân Viên Mới')
    await user.type(within(dialog).getByLabelText('Điện thoại'), '12345')
    await user.type(within(dialog).getByLabelText('Email'), 'not-an-email')
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    expect(await within(dialog).findByText('Số điện thoại gồm 10 chữ số, bắt đầu bằng 0')).toBeInTheDocument()
    expect(within(dialog).getByText('Email không hợp lệ')).toBeInTheDocument()

    await user.clear(within(dialog).getByLabelText('Điện thoại'))
    await user.type(within(dialog).getByLabelText('Điện thoại'), '0912345678')
    await user.clear(within(dialog).getByLabelText('Email'))
    await user.click(within(dialog).getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const row = (await screen.findByText('newstaff')).closest('tr')!
    expect(row).toHaveTextContent('Nhân Viên Mới')
    expect(row).toHaveTextContent('Read')

    await user.click(within(row).getByRole('button', { name: 'Sửa' }))
    const edit = await screen.findByRole('dialog')
    await user.clear(within(edit).getByLabelText('Họ và tên'))
    await user.type(within(edit).getByLabelText('Họ và tên'), 'Đã Đổi Tên')
    await user.click(within(edit).getByRole('button', { name: 'Lưu' }))
    await waitFor(() => expect(screen.getByText('Đã Đổi Tên')).toBeInTheDocument())

    await user.click(within(screen.getByText('newstaff').closest('tr')!).getByRole('button', { name: 'Xóa' }))
    const confirm = await screen.findByRole('alertdialog')
    expect(confirm).toHaveTextContent('Xóa "Đã Đổi Tên"?')
    await user.click(within(confirm).getByRole('button', { name: 'Xóa' }))
    await waitFor(() => expect(screen.queryByText('newstaff')).not.toBeInTheDocument())
  })

  it('cancelling the delete confirmation keeps the customer', async () => {
    const user = userEvent.setup()
    renderAt(page, '/admin/customers')
    await screen.findByText('demo-user')
    await user.click(within(screen.getByText('demo-user').closest('tr')!).getByRole('button', { name: 'Xóa' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Hủy' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.getByText('demo-user')).toBeInTheDocument()
  })
})

describe('contract URLs', () => {
  it('maps image URLs through one helper', () => {
    expect(imgUrl(null)).toBe('/img/product/snack.jpg')
    expect(imgUrl('/img/product/food.jpg')).toBe('/img/product/food.jpg')
    expect(imgUrl('/user-photos/abc.png')).toBe('http://localhost/api/v1/photos/abc.png')
    expect(imgUrl('/api/v1/photos/abc.png')).toBe('/api/v1/photos/abc.png')
  })

  it('sends the contact form to POST /api/v1/contact', async () => {
    await expect(shopApi.sendContact({ name: 'A', email: 'a@b.co', message: 'hi' })).resolves.toBeUndefined()
  })
})
