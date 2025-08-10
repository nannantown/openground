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

  // Get dynamic listing pages
  let listingPages: MetadataRoute.Sitemap = []
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/listings`, {
      cache: 'no-store'
    })
    if (response.ok) {
      const listings = await response.json()
      listingPages = listings.map((listing: any) => ({
        url: `${baseUrl}/listing/${listing.id}`,
        lastModified: new Date(listing.created_at),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Failed to fetch listings for sitemap:', error)
  }

  return [
    ...staticPages,
    ...listingPages,
  ]
}