'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/app/providers'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FavouriteButton } from '@/components/FavouriteButton'
import { Search, Plus, Loader2, Grid3X3, List } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Listing } from '@/shared/types'

export function ListingGrid() {
  const supabase = useSupabase()
  const searchParams = useSearchParams()
  
  // Get search query for display
  const searchQuery = searchParams.get('q') || ''
  const categoryFilter = searchParams.get('cat') || ''

  const { data: listings = [], isLoading, error } = useQuery({
    queryKey: ['listings', searchParams.toString()],
    queryFn: async () => {
      try {
        // Use the API route
        const params = new URLSearchParams(searchParams)
        const url = `/api/v1/listings?${params.toString()}`
        console.log('Fetching listings from:', url)
        
        const response = await fetch(url)
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('API error:', errorText)
          throw new Error(`Failed to fetch listings: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Fetched listings:', data.length, 'items')
        return data as Listing[]
      } catch (err) {
        console.error('Fetch error:', err)
        throw err
      }
    },
  })

  // Debug logging
  console.log('ListingGrid state:', { isLoading, error, listingsCount: listings.length })

  const formatPrice = (price?: number | null) => {
    if (price == null) return 'Contact for price'
    return new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: 'USD' 
    }).format(Number(price))
  }

  const firstImage = (listing: Listing) => {
    const images = listing.images as string[]
    return images?.[0]
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold mb-2 text-red-600">エラーが発生しました</h3>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">読み込み中...</h3>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-xl font-semibold mb-2">
          {(searchQuery || categoryFilter) ? '検索結果が見つかりません' : '商品がありません'}
        </h3>
        <p className="text-muted-foreground mb-6">
          {(searchQuery || categoryFilter) 
            ? '検索条件を変更するか、すべてのカテゴリを閲覧してください' 
            : '最初の商品を投稿してマーケットプレースを始めましょう'
          }
        </p>
        <Button asChild>
          <Link href="/new-listing">
            <Plus className="w-4 h-4 mr-2" />
            Post Your First Listing
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div data-testid="search-results">
      {(searchQuery || categoryFilter) && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-800 mb-2">検索結果</h2>
          <div data-testid="search-query" className="text-blue-700">
            {searchQuery && (
              <span>キーワード: "{searchQuery}"</span>
            )}
            {searchQuery && categoryFilter && <span className="mx-2">•</span>}
            {categoryFilter && (
              <span>カテゴリ: {categoryFilter}</span>
            )}
          </div>
          <div className="text-blue-600 text-sm mt-1">
            {listings.length}件の商品が見つかりました
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold">
          {(searchQuery || categoryFilter) ? '検索結果' : '最新の商品'}
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            <Grid3X3 className="w-4 h-4 mr-2" />
            Grid
          </Button>
          <Button variant="ghost" size="sm">
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.map((listing) => (
          <Card key={listing.id} data-testid="listing-card" className="overflow-hidden">
            <div className="relative h-48 overflow-hidden">
              <Link href={`/listing/${listing.id}`} className="block">
                {firstImage(listing) ? (
                  <Image
                    src={firstImage(listing)}
                    alt={listing.title}
                    fill
                    className="object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">No Image</span>
                  </div>
                )}
              </Link>
              <div className="absolute top-2 right-2">
                <FavouriteButton listingId={listing.id} />
              </div>
            </div>
            
            <CardContent className="p-4">
              <Link href={`/listing/${listing.id}`} className="block">
                <h3 className="font-semibold mb-2 line-clamp-2 hover:text-primary">{listing.title}</h3>
                <p className="text-lg font-bold text-primary mb-2">
                  {formatPrice(listing.price)}
                </p>
                {listing.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {listing.description.slice(0, 80)}
                    {listing.description.length > 80 ? '...' : ''}
                  </p>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {new Date(listing.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}