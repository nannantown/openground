import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({
  children,
  params
}: Props) {
  const { locale } = await params
  const messages = await getMessages({locale})
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "OpenGround",
    "url": "https://openground.app",
    "logo": "https://openground.app/logo.png",
    "description": "日本最大級の地域密着型クラシファイドサイト。中古品、不動産、求人、サービスなど、あらゆる売買・交換を安全にサポート。",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "JP"
    },
    "sameAs": [
      "https://twitter.com/openground",
      "https://www.facebook.com/openground"
    ]
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "OpenGround",
    "url": "https://openground.app",
    "description": "日本最大級の地域密着型クラシファイドサイト",
    "inLanguage": "ja-JP",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://openground.app/?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}