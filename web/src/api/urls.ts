// One place for the non-JSON URL conventions of the backend contract.
export const CONTACT_PATH = '/contact' // POST {API_BASE}/contact
// Uploaded catalog images come back as absolute paths: /api/v1/photos/catalog/** (public, same origin as the API)

const FALLBACK_IMAGE = '/img/product/snack.jpg'

// imageUrl from the API -> something an <img> can load ("/img/..." is bundled with the web app)
export function imgUrl(url: string | null): string {
  if (!url) return FALLBACK_IMAGE
  return url
}
