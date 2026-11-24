import i18n from '@/i18n'
import { ApiError } from './http'
import type { ImageProblem } from '@/lib/image'

// One place that turns API failures into a user-facing message (current UI language).
export function errorMessage(e: unknown): string {
  const t = i18n.t.bind(i18n)
  if (!(e instanceof ApiError)) return e instanceof TypeError ? t('errors.network') : t('errors.unknown')
  switch (e.status) {
    case 400: return t('errors.badRequest', { detail: e.message })
    case 401: return t('errors.unauthorized')
    case 403: return t('errors.forbidden')
    case 404: return t('errors.notFound')
    case 409: return t('errors.conflict')
    case 413: return t('errors.tooLarge')
    case 415: return t('errors.unsupportedType')
    default: return e.status >= 500 ? t('errors.server') : e.message
  }
}

export const imageProblemMessage = (p: ImageProblem) => i18n.t(p === 'size' ? 'errors.tooLarge' : 'errors.unsupportedType')
