import { LogIn, LogOut, Menu, PawPrint, ShieldCheck, ShoppingCart, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/auth/context'
import { useCart } from '@/cart/context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { LangToggle, ThemeToggle } from './Toggles'

const links = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/shop/products', key: 'nav.products' },
  { to: '/shop/foods', key: 'nav.foods' },
  { to: '/about', key: 'nav.about' },
  { to: '/blog', key: 'nav.blog' },
  { to: '/contact', key: 'nav.contact' },
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground"><PawPrint className="size-4" /></span>
      <span className="text-lg">PETS<span className="text-primary">Store</span></span>
    </Link>
  )
}

function AdminLink({ onClick, className }: { onClick?: () => void; className?: string }) {
  const { isAdmin } = useAuth()
  const { t } = useTranslation()
  if (!isAdmin) return null
  return <Link to="/admin" onClick={onClick} className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-primary hover:bg-accent', className)}><ShieldCheck className="size-4" />{t('nav.admin')}</Link>
}

function UserMenu() {
  const { user, isAdmin, login, logout, mock } = useAuth()
  const { t } = useTranslation()
  if (!user) {
    if (!mock) return <Button size="sm" onClick={() => login()} aria-label={t('nav.login')}><LogIn /> <span className="hidden sm:inline">{t('nav.login')}</span></Button>
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button size="sm" aria-label={t('nav.login')}><LogIn /> <span className="hidden sm:inline">{t('nav.login')}</span></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => login('customer')}>{t('auth.loginCustomer')}</DropdownMenuItem>
          <DropdownMenuItem onClick={() => login('admin')}>{t('auth.loginAdmin')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={user.name}><User /> <span className="hidden max-w-28 truncate md:inline">{user.name}</span></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/profile">{t('nav.profile')}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/orders">{t('nav.history')}</Link></DropdownMenuItem>
        {isAdmin && <DropdownMenuItem asChild><Link to="/admin"><ShieldCheck /> {t('nav.admin')}</Link></DropdownMenuItem>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}><LogOut /> {t('nav.logout')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SiteLayout() {
  const { t } = useTranslation()
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('nav.menu')}><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader><SheetTitle>PETS Store</SheetTitle></SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {links.map((l) => (
                  <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
                    className={({ isActive }) => cn('rounded-md px-3 py-2 text-sm', isActive ? 'bg-accent font-medium text-primary' : 'text-muted-foreground')}>
                    {t(l.key)}
                  </NavLink>
                ))}
                <AdminLink onClick={() => setOpen(false)} className="py-2" />
              </nav>
            </SheetContent>
          </Sheet>
          <Brand />
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end}
                className={({ isActive }) => cn('rounded-md px-3 py-1.5 text-sm transition-colors hover:text-foreground', isActive ? 'font-medium text-primary' : 'text-muted-foreground')}>
                {t(l.key)}
              </NavLink>
            ))}
            <AdminLink />
          </nav>
          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <LangToggle />
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon" className="relative" aria-label={t('nav.cart')}>
              <Link to="/cart">
                <ShoppingCart className="size-4" />
                {count > 0 && <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 text-[10px]">{count}</Badge>}
              </Link>
            </Button>
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="border-t bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div className="space-y-2">
            <Brand />
            <p className="text-sm text-muted-foreground">{t('footer.tagline')}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium">{t('footer.links')}</p>
            {links.slice(1, 4).map((l) => <Link key={l.to} to={l.to} className="block text-muted-foreground hover:text-foreground">{t(l.key)}</Link>)}
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-medium">{t('footer.follow')}</p>
            {[['Facebook', 'https://www.facebook.com/PETS-Coffee-And-Services-100166812056116'], ['Instagram', 'https://www.instagram.com/petscoffeeandservices/'], ['Pinterest', 'https://www.pinterest.com/petscoffeeandservices/_saved/']].map(([n, h]) => (
              <a key={n} href={h} target="_blank" rel="noreferrer" className="block text-muted-foreground hover:text-foreground">{n}</a>
            ))}
          </div>
        </div>
        <div className="border-t py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {t('footer.rights')}</div>
      </footer>
    </div>
  )
}
