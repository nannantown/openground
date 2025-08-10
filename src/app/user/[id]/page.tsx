'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { X, Home, User, Package, Star, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Listing } from '@/shared/types'

interface UserProfile {
  id: string
  display_name: string
  avatar_url: string | null
  phone: string | null
  email: string | null
  is_verified: boolean
  created_at: string
  stats: {
    active_listings: number
    total_reviews: number
    average_rating: number | null
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const userId = params?.id as string

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: async (): Promise<UserProfile> => {
      const response = await fetch(`/api/v1/users/${userId}`)
      if (!response.ok) {
        throw new Error('User not found')
      }
      return response.json()
    },
    enabled: !!userId,
  })

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['user-listings', userId],
    queryFn: async (): Promise<Listing[]> => {
      const response = await fetch(`/api/v1/users/${userId}/listings`)
      if (!response.ok) {
        throw new Error('Failed to fetch listings')
      }
      return response.json()
    },
    enabled: !!userId,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/reviews?user_id=${userId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      return response.json()
    },
    enabled: !!userId,
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
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
    ))
  }

  if (userLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>ユーザー情報を読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
            <X className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-4">ユーザーが見つかりません</h2>
            <p className="text-gray-600 mb-6">
              このユーザーは存在しません
            </p>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8">
        <div className="container">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              {user.avatar_url ? (
                <div className="relative h-24 w-24 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={user.avatar_url}
                    alt={user.display_name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-12 h-12 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{user.display_name}</h1>
                  {user.is_verified && (
                    <span className="text-blue-500" title="認証済み">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                
                <div className="text-gray-600 mb-4">
                  {formatDate(user.created_at)}に参加
                </div>

                {/* Stats */}
                <div className="flex flex-wrap gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {user.stats.active_listings}
                    </div>
                    <div className="text-sm text-gray-600">出品中</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {user.stats.total_reviews}
                    </div>
                    <div className="text-sm text-gray-600">レビュー</div>
                  </div>
                  
                  {user.stats.average_rating && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {user.stats.average_rating}
                      </div>
                      <div className="text-sm text-gray-600">平均評価</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Listings */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <h2 className="text-xl font-bold mb-6">出品中の商品</h2>
                
                {listingsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    <p>商品を読み込み中...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-gray-600">まだ商品を出品していません</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {listings.slice(0, 6).map((listing) => {
                      const images = (listing.images as string[]) || []
                      return (
                        <Link
                          key={listing.id}
                          href={`/listing/${listing.id}`}
                          className="block bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="relative h-32">
                            {images[0] ? (
                              <Image
                                src={images[0]}
                                alt={listing.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-32 bg-muted flex items-center justify-center">
                                <Camera className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                              {listing.title}
                            </h3>
                            <div className="text-sm font-bold text-green-600">
                              {formatPrice(listing.price)}
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
                
                {listings.length > 6 && (
                  <div className="text-center mt-6">
                    <button className="btn btn-outline">
                      すべての商品を見る ({listings.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-6">レビュー</h2>
                
                {reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-gray-600">まだレビューがありません</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review: any) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center gap-3 mb-2">
                          {review.from_user?.avatar_url ? (
                            <div className="relative h-8 w-8 rounded-full overflow-hidden">
                              <Image
                                src={review.from_user.avatar_url}
                                alt={review.from_user.display_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-sm">
                              {review.from_user?.display_name || 'Anonymous'}
                            </div>
                            <div className="text-xs">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}