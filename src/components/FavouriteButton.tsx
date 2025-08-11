'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFavourites } from '@/hooks/useFavourites'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FavouriteButtonProps {
  listingId: string
  className?: string
}

export function FavouriteButton({ listingId, className = '' }: FavouriteButtonProps) {
  const { user } = useAuth()
  const { favouriteIds, toggleFavourite, isToggling } = useFavourites()
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(false)
  const t = useTranslations('common')
  const tFav = useTranslations('favourites')

  const isFavourite = favouriteIds.includes(listingId)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      router.push('/login')
      return
    }

    try {
      setIsAnimating(true)
      await toggleFavourite(listingId)
      
      // Add a small delay for animation
      setTimeout(() => {
        setIsAnimating(false)
      }, 300)
    } catch (error) {
      console.error('Error toggling favourite:', error)
      alert(t('error'))
      setIsAnimating(false)
    }
  }

  return (
    <Button
      data-testid="favourite-button"
      onClick={handleClick}
      disabled={isToggling}
      variant="outline"
      size="icon"
      className={`
        relative w-10 h-10 rounded-full
        transition-all duration-200 ease-in-out
        ${isFavourite 
          ? 'bg-red-500 text-white hover:bg-red-600 border-red-500' 
          : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-500 border-gray-300'
        }
        ${isAnimating ? 'scale-110' : 'hover:scale-105'}
        ${className}
      `}
      title={isFavourite ? tFav('removeFromFavourites') : tFav('addToFavourites')}
    >
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart 
          className={`h-4 w-4 transition-transform duration-200 ${isAnimating ? 'scale-125' : ''}`}
          fill={isFavourite ? 'currentColor' : 'none'}
        />
      )}
    </Button>
  )
}