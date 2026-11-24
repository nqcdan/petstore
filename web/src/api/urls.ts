import { API_BASE } from './http'

// One place for the non-JSON URL conventions of the backend contract.
export const CONTACT_PATH = '/contact' // POST {API_BASE}/contact
const PHOTOS_PREFIX = `${API_BASE}/photos/` // uploaded images: GET {API_BASE}/photos/**
const LEGACY_UPLOADS = '/user-photos/' // pre-photos-endpoint backend, mapped for older data

const FALLBACK_IMAGE = '/img/product/snack.jpg'

// imageUrl from the API -> something an <img> can load ("/img/..." is bundled with the web app)
export function imgUrl(url: string | null): string {
  if (!url) return FALLBACK_IMAGE
  if (url.startsWith(LEGACY_UPLOADS)) return PHOTOS_PREFIX + url.slice(LEGACY_UPLOADS.length)
  return url
}
