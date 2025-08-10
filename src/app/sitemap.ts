import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://openground.app'

  // Static pages
  const staticPages = [
    '',
    '/login',
    '/favourites',
    '/messages',
    '/me/listings',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // For static generation, we'll skip dynamic pages for now
  // In production, these would be generated via ISR or build-time data fetching
  const listingPages: MetadataRoute.Sitemap = []

  return [
    ...staticPages,
    ...listingPages,
  ]
}