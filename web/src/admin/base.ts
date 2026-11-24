// Admin build (VITE_APP=admin) serves the back office at the root; the storefront bundle keeps it under /admin.
export const IS_ADMIN_APP = import.meta.env.VITE_APP === 'admin'
export const ADMIN_BASE = IS_ADMIN_APP ? '' : '/admin'
export const adminPath = (sub = '') => `${ADMIN_BASE}${sub}` || '/'

// Where the shop lives, shown as "back to shop" in the admin site (empty hides the link)
export const SHOP_URL: string = import.meta.env.VITE_SHOP_URL ?? ''
// Where the storefront sends admins: the separate admin site when set, else the built-in /admin
export const ADMIN_URL: string = import.meta.env.VITE_ADMIN_URL || '/admin'
