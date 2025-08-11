import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations('hero')
  
  return (
    <section className="py-16 text-center">
      <div className="container">
        <h1 className="text-4xl font-bold mb-4">
          {t('title')}
        </h1>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          {t('subtitle')}
        </p>
      </div>
    </section>
  )
}