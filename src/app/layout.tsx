import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    template: '%s | OpenGround',
    default: 'OpenGround - 地域密着型マーケットプレイス',
  },
  description: '日本最大級の地域密着型クラシファイドサイト。中古品、不動産、求人、サービスなど、あらゆる売買・交換を安全にサポート。',
  keywords: ['フリマ', 'マーケットプレイス', '中古品', '売買', 'クラシファイド', 'コミュニティ', '地域'],
  authors: [{ name: 'OpenGround' }],
  creator: 'OpenGround',
  publisher: 'OpenGround',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://openground.app',
    siteName: 'OpenGround',
    title: 'OpenGround - 地域密着型マーケットプレイス',
    description: '日本最大級の地域密着型クラシファイドサイト。中古品、不動産、求人、サービスなど、あらゆる売買・交換を安全にサポート。',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'OpenGround',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenGround - 地域密着型マーケットプレイス',
    description: '日本最大級の地域密着型クラシファイドサイト',
    images: ['/og-image.jpg'],
    creator: '@openground',
  },
  verification: {
    // Add verification tokens when available
    // google: 'your-google-verification-token',
    // yahoo: 'your-yahoo-verification-token',
  },
  alternates: {
    canonical: 'https://openground.app',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
    <html lang="ja">
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
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}