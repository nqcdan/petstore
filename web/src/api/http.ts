import { getToken } from '@/auth/token'

export const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api/v1'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Query = Record<string, string | number | undefined>

function qs(query?: Query) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== '') p.set(k, String(v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export async function request<T>(
  method: string,
  path: string,
  opts: { query?: Query; body?: unknown; form?: FormData } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = await getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  let body: BodyInit | undefined
  if (opts.form) body = opts.form
  else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }
  const res = await fetch(`${API_BASE}${path}${qs(opts.query)}`, { method, headers, body })
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.detail ?? body.message ?? body.title ?? message
    } catch {
      /* body is not JSON */
    }
    throw new ApiError(res.status, message)
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export const get = <T>(path: string, query?: Query) => request<T>('GET', path, { query })
export const post = <T>(path: string, body?: unknown) => request<T>('POST', path, { body })
export const put = <T>(path: string, body?: unknown) => request<T>('PUT', path, { body })
export const patch = <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body })
export const del = <T = void>(path: string) => request<T>('DELETE', path)
