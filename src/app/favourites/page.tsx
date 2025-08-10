'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useSupabase } from '@/app/providers'
import { Header } from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Lock, Key, Heart, HeartOff, Home, Camera, Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Listing } from '@/shared/types'

export default function FavouritesPage() {
  const { user, isLoading: authLoading } = useAuth()
  const supabase = useSupabase()
  const router = useRouter()

  const { data: favourites = [], isLoading, refetch } = useQuery({
    queryKey: ['favourites-full'],
    queryFn: async () => {
      if (!user) return []
      
      const response = await fetch('/api/v1/favourites/full')
      if (!response.ok) {
        if (response.status === 401) return []
        throw new Error('Failed to fetch favourites')
      }
      
      return response.json() as Promise<Listing[]>
    },
    enabled: !!user,
  })

  const removeFavourite = async (listingId: string) => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/v1/favourites/${listingId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove favourite')
      }
      
      await refetch()
    } catch (error) {
      console.error('Error removing favourite:', error)
      alert('お気に入りの削除に失敗しました。もう一度お試しください。')
    }
  }

  const formatPrice = (price?: number | null) => {
    if (price == null) return '価格相談'
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(Number(price))
  }

  const firstImage = (listing: Listing) => {
    const images = listing.images as string[]
    return images?.[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>読み込み中...</p>
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
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-4">サインインが必要です</h2>
            <p className="text-gray-600 mb-6">
              お気に入り機能を使用するには、アカウントにサインインしてください
            </p>
            <Button data-testid="login-button" asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
              <Link href="/login">
                <Key className="w-4 h-4 mr-2" />
                サインイン
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      <main className="py-8">
        <div className="container">
          {/* Header Section */}
          <header className="mb-8">
            <div className="flex justify-between items-start gap-6">
              <div>
                <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500 fill-current" />
                  お気に入り
                </h1>
                <p className="text-gray-600">保存したアイテムをここで管理できます</p>
              </div>
              {favourites.length > 0 && (
                <div className="bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold">
                  {favourites.length} 件のお気に入り
                </div>
              )}
            </div>
          </header>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p>お気に入りを読み込み中...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && favourites.length === 0 && (
            <div className="text-center py-16">
              <HeartOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">まだお気に入りがありません</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                気になる商品を見つけて、ハートボタンを押してお気に入りに追加しましょう
              </p>
              <Button data-testid="browse-listings-button" asChild size="lg" className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  商品を探す
                </Link>
              </Button>
            </div>
          )}

          {/* Favourites Grid */}
          {!isLoading && favourites.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {favourites.map((listing) => (
                <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {/* Listing Image */}
                  <div className="relative h-48">
                    {firstImage(listing) ? (
                      <Image
                        src={firstImage(listing)}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      onClick={() => removeFavourite(listing.id)}
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2 w-8 h-8 bg-destructive/80 hover:bg-destructive/90"
                      title="お気に入りから削除"
                    >
                      <HeartOff className="w-4 h-4" />
                    </Button>
                  </div>

                  <CardContent className="p-4">
                    <Link href={`/listing/${listing.id}`} className="block hover:text-blue-600">
                      <h3 className="font-semibold mb-2 line-clamp-2">
                        {listing.title}
                      </h3>
                      <div className="text-lg font-bold text-yellow-600 mb-2">
                        {formatPrice(listing.price)}
                      </div>
                      {listing.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {listing.description.slice(0, 80)}
                          {listing.description.length > 80 ? '...' : ''}
                        </p>
                      )}
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(listing.created_at)}
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}