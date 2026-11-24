import { Route, Routes } from 'react-router-dom'
import { NotFound } from '@/pages/NotFound'
import { AdminLayout } from './AdminLayout'
import { CatalogPage } from './CatalogPage'
import { CustomersPage, EmployeesPage } from './People'
import { Dashboard } from './Dashboard'
import { OrdersPage } from './OrdersPage'

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<CatalogPage kind="products" />} />
        <Route path="foods" element={<CatalogPage kind="foods" />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
