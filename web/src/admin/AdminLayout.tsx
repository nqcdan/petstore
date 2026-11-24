import { Boxes, LayoutDashboard, LogOut, Package, ReceiptText, Store, UserCog, Users, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import { LangToggle, ThemeToggle } from '@/components/layout/Toggles'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'

const nav = [
  { to: '/admin', key: 'admin.dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', key: 'admin.products', icon: Package },
  { to: '/admin/foods', key: 'admin.foods', icon: UtensilsCrossed },
  { to: '/admin/orders', key: 'admin.orders', icon: ReceiptText },
  { to: '/admin/customers', key: 'admin.customers', icon: Users },
  { to: '/admin/employees', key: 'admin.employees', icon: UserCog },
]

export function AdminLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/admin">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Boxes className="size-4" /></div>
                  <div className="grid text-left leading-tight"><span className="font-semibold">PETS Store</span><span className="text-xs text-muted-foreground">{t('admin.title')}</span></div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav.map((n) => (
                  <SidebarMenuItem key={n.to}>
                    <NavLink to={n.to} end={n.end}>
                      {({ isActive }) => (
                        <SidebarMenuButton asChild isActive={isActive} tooltip={t(n.key)}>
                          <span><n.icon /><span>{t(n.key)}</span></span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t('admin.backToShop')}><Link to="/"><Store /><span>{t('admin.backToShop')}</span></Link></SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} tooltip={t('nav.logout')}><LogOut /><span className="truncate">{user?.name} · {t('nav.logout')}</span></SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="ml-auto flex items-center gap-1"><LangToggle /><ThemeToggle /></div>
        </header>
        <div className="flex-1 space-y-6 p-4 md:p-6"><Outlet /></div>
      </SidebarInset>
    </SidebarProvider>
  )
}
