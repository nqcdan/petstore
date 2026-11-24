import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en'
import { vi } from './vi'

const LS_KEY = 'petstore.lang'

void i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi }, en: { translation: en } },
  lng: localStorage.getItem(LS_KEY) ?? 'vi',
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
  returnObjects: true,
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LS_KEY, lng)
  document.documentElement.lang = lng
})

export default i18n
