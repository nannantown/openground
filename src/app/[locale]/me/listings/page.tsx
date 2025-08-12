'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useSupabase } from '@/app/[locale]/providers'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Key, FileText, Camera, Calendar, Eye, Trash2, Loader2, Plus, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Listing } from '@/shared/types'

export default function MyListingsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const t = useTranslations('myListings')
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const tListings = useTranslations('listings')
  const supabase = useSupabase()

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Listing[]
    },
    enabled: !!user,
  })

  const formatPrice = (price?: number | null) => {
    if (price == null) return tListings('contactPrice')
    return new Intl.NumberFormat(undefined, { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(Number(price))
  }

  const firstImage = (listing: Listing) => {
    const images = listing.images as string[]
    return images?.[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, { 
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
            <p>{tCommon('loading')}</p>
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
            <h2 className="text-2xl font-semibold mb-4">{tAuth('signInRequired')}</h2>
            <p className="text-gray-600 mb-6">
              {tAuth('signInDesc')}
            </p>
            <Button asChild size="lg" variant="primary">
              <Link href="/login">
                <Key className="w-4 h-4 mr-2" />
                {tAuth('signIn')}
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  <FileText className="w-4 h-4 mr-2" />
                  {t('title')}
                </h1>
                <p className="text-gray-600">{t('subtitle')}</p>
              </div>
              <div className="flex gap-3">
                <Button data-testid="new-listing-button" asChild variant="primary">
                  <Link href="/new-listing">
                    <Plus className="w-4 h-4 mr-2" />
                    {tListings('newListing')}
                  </Link>
                </Button>
              </div>
            </div>
            {listings.length > 0 && (
              <div className="mt-4">
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium inline-block">
                  {t('itemsPosted', { count: listings.length })}
                </div>
              </div>
            )}
          </header>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p>{t('loading')}</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && listings.length === 0 && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">{t('noListings')}</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {t('noListingsDesc')}
              </p>
              <Button data-testid="first-listing-button" asChild size="lg" variant="primary">
                <Link href="/new-listing">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('postFirst')}
                </Link>
              </Button>
            </div>
          )}

          {/* Listings Grid */}
          {!isLoading && listings.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <article key={listing.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
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
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-green-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Listing Content */}
                  <div className="p-4">
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
                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(listing.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 mr-1" />
                          0 views
                        </span>
                      </div>
                    </Link>
                    
                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <Button data-testid="edit-listing-button" asChild variant="ghost" size="sm">
                        <Link href={`/listing/${listing.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          {tListings('edit')}
                        </Link>
                      </Button>
                      <Button data-testid="delete-listing-button" variant="danger" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {tListings('delete')}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}