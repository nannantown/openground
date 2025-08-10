'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/Header'
import Image from 'next/image'
import Link from 'next/link'
import { FavouriteButton } from '@/components/FavouriteButton'
import { X, Home, Camera, FileText, MessageCircle, Phone, User, AlertTriangle, Loader2, Edit, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Listing } from '@/shared/types'
import Head from 'next/head'

interface ListingWithOwner extends Listing {
  owner: {
    id: string
    display_name: string
    avatar_url: string | null
    is_verified: boolean
  }
}

export default function ListingPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const listingId = params?.id as string

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async (): Promise<ListingWithOwner> => {
      const response = await fetch(`/api/v1/listings/${listingId}`)
      if (!response.ok) {
        throw new Error('Listing not found')
      }
      return response.json()
    },
    enabled: !!listingId,
  })

  const formatPrice = (price?: number | null) => {
    if (price == null) return '価格相談'
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(Number(price))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const startChat = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch('/api/v1/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listingId,
          message: `${listing?.title}について質問があります。`
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start chat')
      }

      const thread = await response.json()
      router.push(`/messages/${thread.id}`)
    } catch (error) {
      console.error('Error starting chat:', error)
      alert('チャットの開始に失敗しました。もう一度お試しください。')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>商品情報を読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
            <X className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-4">商品が見つかりません</h2>
            <p className="text-gray-600 mb-6">
              この商品は削除されたか、存在しません
            </p>
            <Button data-testid="home-button" asChild className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                ホームに戻る
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const images = (listing.images as string[]) || []
  const isOwner = user && user.id === listing.owner_id

  // Generate JSON-LD structured data
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": listing.title,
    "description": listing.description || listing.title,
    "image": images,
    "url": `https://openground.app/listing/${listing.id}`,
    "sku": listing.id,
    "offers": {
      "@type": "Offer",
      "price": listing.price || 0,
      "priceCurrency": "JPY",
      "availability": listing.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      "url": `https://openground.app/listing/${listing.id}`,
      "seller": {
        "@type": "Person",
        "name": listing.owner.display_name,
        "url": `https://openground.app/user/${listing.owner.id}`
      }
    },
    "category": listing.category,
    "datePublished": listing.created_at,
    "aggregateRating": listing.owner.is_verified ? {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    } : undefined
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema),
        }}
      />
      <Header />
      
      <main className="py-8">
        <div className="container">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm">
            <Link href="/" className="text-blue-600 hover:underline">ホーム</Link>
            {listing.category && (
              <>
                <span className="mx-2 text-gray-500">›</span>
                <Link 
                  href={`/?cat=${encodeURIComponent(listing.category)}`}
                  className="text-blue-600 hover:underline"
                >
                  {listing.category}
                </Link>
              </>
            )}
            <span className="mx-2 text-gray-500">›</span>
            <span className="text-gray-900">{listing.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Images */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {images.length > 0 ? (
                  <div className="relative h-96">
                    <Image
                      src={images[0]}
                      alt={listing.title}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute top-4 right-4">
                      <FavouriteButton listingId={listing.id} />
                    </div>
                  </div>
                ) : (
                  <div className="h-96 bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-gray-500">画像なし</p>
                    </div>
                  </div>
                )}

                {/* Thumbnail gallery */}
                {images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {images.slice(1).map((image, index) => (
                      <div key={index} className="relative h-20 w-20 flex-shrink-0 rounded overflow-hidden">
                        <Image
                          src={image}
                          alt={`${listing.title} ${index + 2}`}
                          fill
                          className="object-cover cursor-pointer hover:opacity-80"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              {listing.description && (
                <div className="bg-white rounded-lg shadow-sm mt-6 p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    詳細
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="whitespace-pre-wrap">{listing.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Price & Title */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold mb-4">{listing.title}</h1>
                <div className="text-3xl font-bold text-green-600 mb-4">
                  {formatPrice(listing.price)}
                </div>
                
                {!isOwner && (
                  <div className="space-y-3">
                    <button
                      data-testid="contact-seller-button"
                      onClick={startChat}
                      className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 py-3 px-4 rounded-lg font-semibold transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      出品者にメッセージ
                    </button>
                    <button data-testid="phone-contact-button" className="w-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 py-3 px-4 rounded-lg font-semibold transition-colors">
                      <Phone className="w-4 h-4 mr-2" />
                      電話で問い合わせ
                    </button>
                  </div>
                )}

                {isOwner && (
                  <div className="space-y-3">
                    <Link data-testid="edit-listing-button" href={`/listing/${listing.id}/edit`} className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 py-3 px-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center">
                      <Edit className="w-4 h-4 mr-2" />
                      編集
                    </Link>
                    <div className="text-sm text-gray-600">
                      これはあなたの商品です
                    </div>
                  </div>
                )}
              </div>

              {/* Seller Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  出品者情報
                </h2>
                <div className="flex items-center gap-3 mb-4">
                  {listing.owner.avatar_url ? (
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={listing.owner.avatar_url}
                        alt={listing.owner.display_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      {listing.owner.display_name}
                      {listing.owner.is_verified && (
                        <CheckCircle className="w-5 h-5 text-blue-500" aria-label="認証済み" />
                      )}
                    </div>
                  </div>
                </div>
                
                <Link 
                  data-testid="view-profile-button"
                  href={`/user/${listing.owner.id}`} 
                  className="w-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 py-2 px-3 rounded-md font-medium transition-colors text-center"
                >
                  プロフィールを見る
                </Link>
              </div>

              {/* Listing Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  商品情報
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">カテゴリ:</span>
                    <span>{listing.category || '未設定'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">投稿日:</span>
                    <span>{formatDate(listing.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">商品ID:</span>
                    <span className="font-mono text-xs">{listing.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>

              {/* Report */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <button data-testid="report-button" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 py-2 px-3 rounded-md font-medium transition-colors">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  この商品を報告
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}