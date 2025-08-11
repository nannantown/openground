'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const categories = ['Electronics', 'Home', 'Vehicles', 'Jobs']

export function SearchForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('search')
  const tCategories = useTranslations('categories')
  
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [cat, setCat] = useState(searchParams.get('cat') || '')
  const [min, setMin] = useState(searchParams.get('min') || '')
  const [max, setMax] = useState(searchParams.get('max') || '')
  const [radiusKm, setRadiusKm] = useState(searchParams.get('r') || '')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (cat) params.set('cat', cat)
    if (min) params.set('min', min)
    if (max) params.set('max', max)
    if (radiusKm) params.set('r', radiusKm)
    
    router.push(`/?${params.toString()}`)
  }
  
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    
    navigator.geolocation.getCurrentPosition((pos) => {
      const params = new URLSearchParams(searchParams)
      params.set('lat', pos.coords.latitude.toString())
      params.set('lng', pos.coords.longitude.toString())
      router.push(`/?${params.toString()}`)
    })
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Label htmlFor="search">{t('searchLabel')}</Label>
              <Input
                data-testid="search-input"
                id="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                type="search"
                placeholder={t('placeholder')}
              />
            </div>
            <div>
              <Label htmlFor="category">{t('category')}</Label>
              <select 
                id="category"
                value={cat} 
                onChange={(e) => setCat(e.target.value)} 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">{t('allCategories')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {tCategories(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="min-price">{t('minPrice')}</Label>
              <Input
                id="min-price"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                type="number"
                placeholder="¥0"
              />
            </div>
            <div>
              <Label htmlFor="max-price">{t('maxPrice')}</Label>
              <Input
                id="max-price"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                type="number"
                placeholder={t('noLimit')}
              />
            </div>
            <div>
              <Label htmlFor="distance">{t('distance')}</Label>
              <Input
                id="distance"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                type="number"
                placeholder="25"
                min="1"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button
                data-testid="location-button"
                type="button"
                variant="outline"
                onClick={useCurrentLocation}
                className="w-full border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {t('useLocation')}
              </Button>
            </div>
          </div>

          <div className="text-center">
            <Button 
              data-testid="search-button" 
              type="submit" 
              size="lg" 
              className="px-12 bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Search className="w-4 h-4 mr-2" />
              {t('searchButton')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}