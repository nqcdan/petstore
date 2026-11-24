import type { Resources } from './vi'

export const en: Resources = {
  common: {
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'Add new', search: 'Search...', view: 'View details',
    back: 'Back', loading: 'Loading...', error: 'Something went wrong', retry: 'Retry', previous: 'Previous', next: 'Next',
    empty: 'No data', currency: 'VND', all: 'All', actions: 'Actions', saved: 'Saved', page: 'Page {{page}} / {{total}}',
  },
  nav: {
    home: 'Home', products: 'Accessories', foods: 'Food', about: 'About us', blog: 'Blog', contact: 'Contact',
    cart: 'Cart', history: 'Order history', profile: 'Profile', admin: 'Admin', login: 'Sign in', logout: 'Sign out',
    theme: 'Theme', light: 'Light', dark: 'Dark', system: 'System', language: 'Language', menu: 'Menu',
  },
  auth: {
    demoTitle: 'Demo accounts', copy: 'Copy',
    required: 'Please sign in to continue', forbidden: 'You do not have access to this page',
    loginCustomer: 'Sign in as customer (demo)', loginAdmin: 'Sign in as admin (demo)',
  },
  home: {
    slides: [
      { tag: 'ACCESSORIES', title: 'Everything for your pet', text: 'High-quality accessories with a 1-year warranty.', cta: 'Shop now' },
      { tag: 'FOOD', title: 'Food for your pet', text: 'Kibble, pate and vitamins for dogs and cats.', cta: 'Shop now' },
    ],
    featured: 'Featured products', featuredSub: 'Most picked by our customers', featuredFoods: 'Featured food', featuredFoodsSub: 'Kibble, pate and treats for dogs and cats', viewAll: 'View all',
    banners: { products: 'Accessories', foods: 'Food', spa: 'Pet grooming service', shop: 'Shop now', spaCta: 'Try it now' },
    blog: 'Our blog', readMore: 'Read more', gallery: '#PETS_Coffee_And_Services',
  },
  shop: {
    titleProducts: 'Pet accessories', titleFoods: 'Pet food', showing: 'Showing {{count}} of {{total}} results',
    sortBy: 'Sort by price', priceAsc: 'Low to high', priceDesc: 'High to low', defaultSort: 'Default', add: 'Add to cart', added: '"{{name}}" added to cart',
    details: 'Product details', none: 'No products found',
  },
  cart: {
    title: 'Cart', empty: 'Your cart is empty', continue: 'Continue shopping', product: 'Product', price: 'Price', quantity: 'Quantity',
    total: 'Subtotal', remove: 'Remove', clear: 'Clear cart', summary: 'Order summary', checkout: 'Checkout',
  },
  checkout: {
    title: 'Checkout', greeting: 'Hello {{name}}', info: 'Your details', fullName: 'Full name', address: 'Address', phone: 'Phone', email: 'Email',
    note: 'Order note', notePlaceholder: 'Note', yourOrder: 'Your order', total: 'Total', method: 'Payment method',
    cod: 'Cash on delivery (COD)', atm: 'ATM bank transfer', place: 'Place order', chooseMethod: 'Please choose a payment method',
    success: 'Order placed', empty: 'Nothing to check out yet', updateProfile: 'Your account',
  },
  history: {
    title: 'Order history', code: 'Order code', name: 'Order name', date: 'Date', total: 'Total', state: 'Status', empty: 'You have no orders yet',
    detail: 'Order detail', item: 'Item', quantity: 'Quantity', payment: 'Payment', note: 'Note',
  },
  state: { DUE: 'Shipping / awaiting payment', PAID: 'Completed', CANCEL: 'Cancelled' },
  profile: {
    title: 'Profile', avatar: 'Avatar', fullName: 'Full name', email: 'Email', birthday: 'Birthday', phone: 'Phone', address: 'Address',
    username: 'Username', manage: 'Manage account and password (Keycloak)',
  },
  contact: {
    title: 'Contact', sub: 'Questions? Get in touch with us.', branch: 'Branch 1', address: 'Landmark 81 Tower', hotline: 'Hotline',
    send: 'Send message', name: 'Name', email: 'Email', message: 'Message', sent: 'Your message has been saved', emailInvalid: 'Invalid email', required: 'Required',
  },
  about: {
    title: 'About us',
    body: 'PETS is a store dedicated to pet care and grooming. Our experienced team is professionally trained by leading pet-care experts from developed countries. We carry food, accessories, supplements and medicine for your dogs and cats.',
    stats: { customers: 'Customers', items: 'Items', partners: 'Partners', satisfaction: 'Satisfaction' },
    team: 'The PETS team', member: 'Member', leader: 'Team lead', partners: 'Our partners',
  },
  blog: { title: 'Our blog', detail: 'Blog post', share: 'Share', notFound: 'Post not found' },
  footer: { tagline: 'Care and grooming for your pets.', links: 'Links', follow: 'Follow us', rights: 'PETS Store. All rights reserved.' },
  errors: {
    network: 'Cannot reach the server. Check your connection and try again.', unknown: 'Something went wrong.',
    badRequest: 'Invalid data: {{detail}}', unauthorized: 'Your session has expired, please sign in again.',
    forbidden: 'You are not allowed to do this.', notFound: 'The requested data was not found.',
    conflict: 'The change conflicts with existing data (for example the account already exists or the order status is not allowed).',
    tooLarge: 'The image is too large, 2 MB at most.', unsupportedType: 'Only PNG, JPEG or WebP images are accepted.',
    server: 'The server hit an error, please try again later.', maxQuantity: 'At most {{max}} of each item.', maxLines: 'The cart holds at most {{max}} lines.',
  },
  notFound: { title: 'Page not found', text: 'The page you are looking for does not exist.' },
  admin: {
    createAccount: 'Add account', editAccount: 'Edit account', gender: 'Gender', male: 'Male', female: 'Female', birthday: 'Birthday', address: 'Address', unset: 'Not set', phoneInvalid: '10 digits starting with 0',
    title: 'Admin', dashboard: 'Dashboard', products: 'Accessories', foods: 'Food', orders: 'Orders', customers: 'Customers', employees: 'Employees', backToShop: 'Back to shop',
    kpi: { revenue: 'Revenue, 30 days', orders: 'Orders', customers: 'Customers', avg: 'Average order value' },
    revenue30: 'Revenue, last 30 days (paid orders)', ordersByState: 'Orders by status', topItems: 'Top items', sold: 'Sold',
    name: 'Name', type: 'Type', price: 'Price', description: 'Description', image: 'Image', uploadImage: 'Upload image', imageAfterSave: 'Image upload after saving', verified: 'Verified', createItem: 'Add item', editItem: 'Edit item',
    confirmDelete: 'Delete "{{name}}"?', confirmDeleteText: 'This cannot be undone.', deleted: 'Deleted', priceInvalid: 'Price is an integer from 0 to 100,000,000',
    filterState: 'Filter by status', changeState: 'Change status', stateChanged: 'Status updated', customer: 'Customer', orderCount: 'Orders', username: 'Username',
    role: 'Role', phone: 'Phone', email: 'Email', fullName: 'Full name', date: 'Date', code: 'Code', total: 'Total', state: 'Status',
  },
}
