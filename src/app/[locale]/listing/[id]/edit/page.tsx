'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/ImageUpload'
import { ArrowLeft, Edit, Loader2, AlertTriangle, Lock } from 'lucide-react'
import Link from 'next/link'
import type { Listing } from '@/shared/types'

const categories = ['Electronics', 'Home', 'Vehicles', 'Jobs', 'Fashion', 'Books', 'Sports', 'Other']

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic'

interface ListingWithOwner extends Listing {
  owner: {
    id: string
    display_name: string
    avatar_url: string | null
    is_verified: boolean
  }
}

export default function EditListingPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const listingId = params?.id as string
  
  const t = useTranslations('editListing')
  const tCommon = useTranslations('common')
  const tAuth = useTranslations('auth')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'good',
    location: '',
    images: [] as string[]
  })

  // Fetch existing listing data
  const { data: listing, isLoading: listingLoading, error } = useQuery({
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

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/v1/listings/${listingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          price: data.price ? parseFloat(data.price) : null,
          category: data.category,
          condition: data.condition,
          location: data.location,
          images: data.images
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update listing')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch listing data
      queryClient.invalidateQueries({ queryKey: ['listing', listingId] })
      queryClient.invalidateQueries({ queryKey: ['my-listings'] })
      
      router.push(`/listing/${listingId}`)
    },
    onError: (error: Error) => {
      console.error('Error updating listing:', error)
      alert(t('updateFailed'))
    }
  })

  // Populate form when listing data is loaded
  useEffect(() => {
    if (listing) {
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price ? listing.price.toString() : '',
        category: listing.category || '',
        condition: listing.condition || 'good',
        location: listing.location || '',
        images: (listing.images as string[]) || []
      })
    }
  }, [listing])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Loading states
  if (authLoading || listingLoading) {
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

  // Auth check
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
                {tAuth('signIn')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Error or not found
  if (error || !listing) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-semibold mb-4">{t('listingNotFound')}</h2>
            <p className="text-gray-600 mb-6">
              {t('listingNotFoundDesc')}
            </p>
            <Button asChild variant="primary">
              <Link href="/me/listings">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToListings')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Permission check
  const isOwner = user.id === listing.owner_id
  if (!isOwner) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
            <Lock className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-semibold mb-4">{t('accessDenied')}</h2>
            <p className="text-gray-600 mb-6">
              {t('accessDeniedDesc')}
            </p>
            <Button asChild variant="primary">
              <Link href={`/listing/${listingId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToListing')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href={`/listing/${listingId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('backToListing')}
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5" />
                {t('editDetails')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('titleLabel')} *</Label>
                  <Input
                    data-testid="title-input"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={t('titlePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t('descriptionLabel')}</Label>
                  <Textarea
                    data-testid="description-input"
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">{t('priceLabel')}</Label>
                    <Input
                      data-testid="price-input"
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="10000"
                      min="0"
                    />
                    <p className="text-sm text-muted-foreground">
                      {t('priceNote')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">{t('categoryLabel')} *</Label>
                    <select
                      data-testid="category-select"
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      required
                    >
                      <option value="">{t('selectCategory')}</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition">{t('conditionLabel')} *</Label>
                    <select
                      data-testid="condition-select"
                      id="condition"
                      value={formData.condition}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <option value="new">{t('conditionNew')}</option>
                      <option value="excellent">{t('conditionExcellent')}</option>
                      <option value="good">{t('conditionGood')}</option>
                      <option value="fair">{t('conditionFair')}</option>
                      <option value="poor">{t('conditionPoor')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">{t('locationLabel')}</Label>
                    <Input
                      data-testid="location-input"
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder={t('locationPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('imagesLabel') || '商品画像'}</Label>
                  <ImageUpload
                    value={formData.images}
                    onChange={(urls) => handleInputChange('images', urls)}
                    maxFiles={5}
                  />
                </div>

                <div className="flex gap-4 pt-6">
                  <Button 
                    data-testid="cancel-button"
                    type="button" 
                    variant="outline" 
                    asChild 
                    className="flex-1 border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Link href={`/listing/${listingId}`}>{tCommon('cancel')}</Link>
                  </Button>
                  <Button 
                    data-testid="update-button"
                    type="submit" 
                    disabled={updateMutation.isPending || !formData.title || !formData.category}
                    variant="primary"
                  >
                    {updateMutation.isPending ? t('updating') : t('updateButton')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}