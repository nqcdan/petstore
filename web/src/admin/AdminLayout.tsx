import { Boxes, LayoutDashboard, LogOut, Package, ReceiptText, Store, UserCog, UserRound, Users, UtensilsCrossed } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/context'
import { IS_ADMIN_APP, SHOP_URL, adminPath } from './base'
import { Button } from '@/components/ui/button'
import { LangToggle, ThemeToggle } from '@/components/layout/Toggles'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger,
} from '@/components/ui/sidebar'

const nav = [
  { to: adminPath(), key: 'admin.dashboard', icon: LayoutDashboard, end: true },
  { to: adminPath('/products'), key: 'admin.products', icon: Package },
  { to: adminPath('/foods'), key: 'admin.foods', icon: UtensilsCrossed },
  { to: adminPath('/orders'), key: 'admin.orders', icon: ReceiptText },
  { to: adminPath('/customers'), key: 'admin.customers', icon: Users },
  { to: adminPath('/employees'), key: 'admin.employees', icon: UserCog },
]

export function AdminLayout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  return (
    <TooltipProvider>
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to={adminPath()}>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Boxes className="size-4" /></div>
                  <div className="grid text-left leading-tight"><span className="font-semibold">{IS_ADMIN_APP ? 'PETS Admin' : 'PETS Store'}</span><span className="text-xs text-muted-foreground">{t('admin.title')}</span></div>
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
              <SidebarMenuButton size="lg" className="pointer-events-none" tooltip={user?.name}>
                <UserRound />
                <div className="grid min-w-0 text-left leading-tight"><span className="truncate font-medium">{user?.name}</span><span className="truncate text-xs text-muted-foreground">{t('admin.roleAdmin')}</span></div>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} tooltip={t('nav.logout')}><LogOut /><span>{t('nav.logout')}</span></SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <div className="ml-auto flex items-center gap-1">
            {!IS_ADMIN_APP && <Button asChild variant="outline" size="sm"><Link to="/"><Store /> <span className="hidden sm:inline">{t('admin.backToShop')}</span></Link></Button>}
            {IS_ADMIN_APP && SHOP_URL && <Button asChild variant="outline" size="sm"><a href={SHOP_URL}><Store /> <span className="hidden sm:inline">{t('admin.backToShop')}</span></a></Button>}
            <LangToggle /><ThemeToggle /></div>
        </header>
        <div className="flex-1 space-y-6 p-4 md:p-6"><Outlet /></div>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  )
}
