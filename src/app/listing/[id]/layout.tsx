import { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

async function getListing(id: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/listings/${id}`, {
      cache: 'no-store'
    })
    if (!response.ok) {
      return null
    }
    return response.json()
  } catch (error) {
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    return {
      title: '商品が見つかりません',
      description: 'この商品は削除されたか、存在しません。',
    }
  }

  const images = (listing.images as string[]) || []
  const firstImage = images[0]
  const price = listing.price 
    ? new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(listing.price)
    : '価格相談'

  return {
    title: listing.title,
    description: listing.description ? 
      `${listing.description.slice(0, 160)}...` : 
      `${listing.title} - ${price}で販売中。OpenGroundで安全にお取引できます。`,
    keywords: [
      listing.title,
      listing.category,
      'フリマ',
      'マーケットプレイス',
      '中古品',
      '売買'
    ].filter(Boolean),
    openGraph: {
      title: `${listing.title} - ${price}`,
      description: listing.description || `${listing.title}の詳細ページ`,
      type: 'article',
      url: `https://openground.app/listing/${listing.id}`,
      images: firstImage ? [
        {
          url: firstImage,
          width: 800,
          height: 600,
          alt: listing.title,
        }
      ] : [],
      siteName: 'OpenGround',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${listing.title} - ${price}`,
      description: listing.description || `${listing.title}の詳細ページ`,
      images: firstImage ? [firstImage] : [],
    },
    alternates: {
      canonical: `https://openground.app/listing/${listing.id}`,
    },
  }
}

export default function ListingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}