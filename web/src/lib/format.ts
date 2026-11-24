import i18n from '@/i18n'

export const formatVnd = (n: number) => `${new Intl.NumberFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-US').format(n)} ${i18n.t('common.currency')}`

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(i18n.language === 'vi' ? 'vi-VN' : 'en-GB', { dateStyle: 'medium' }).format(new Date(iso))

