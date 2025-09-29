export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'id',
  fallbackLocale: 'id',
  numberFormats: {
    'id': {
      currency: {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }
    },
    'en': {
      currency: {
        style: 'currency',
        currency: 'USD'
      }
    }
  }
}))