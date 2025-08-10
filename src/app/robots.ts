import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/me/',
          '/messages/',
          '/login',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/me/',
          '/messages/',
          '/login',
          '/private/',
        ],
      },
    ],
    sitemap: 'https://openground.app/sitemap.xml',
    host: 'https://openground.app',
  }
}