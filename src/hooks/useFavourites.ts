'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

export function useFavourites() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Get user's favourite listing IDs
  const { data: favouriteIds = [], isLoading } = useQuery({
    queryKey: ['favourites'],
    queryFn: async () => {
      const response = await fetch('/api/v1/favourites')
      if (!response.ok) {
        if (response.status === 401) return []
        throw new Error('Failed to fetch favourites')
      }
      return response.json() as Promise<string[]>
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Add to favourites
  const addFavourite = useMutation({
    mutationFn: async (listingId: string) => {
      const response = await fetch('/api/v1/favourites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listing_id: listingId }),
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        console.error('Add favourite error:', { status: response.status, error })
        throw new Error(error.error || `HTTP ${response.status}: Failed to add favourite`)
      }
      
      return response.json()
    },
    onSuccess: (_, listingId) => {
      // Update the favourites list
      queryClient.setQueryData(['favourites'], (old: string[] = []) => {
        if (!old.includes(listingId)) {
          return [...old, listingId]
        }
        return old
      })
      
      // Also invalidate the full favourites data to refresh the favourites page
      queryClient.invalidateQueries({ queryKey: ['favourites-full'] })
    },
  })

  // Remove from favourites
  const removeFavourite = useMutation({
    mutationFn: async (listingId: string) => {
      const response = await fetch(`/api/v1/favourites/${listingId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }))
        console.error('Remove favourite error:', { status: response.status, error })
        throw new Error(error.error || `HTTP ${response.status}: Failed to remove favourite`)
      }
      
      return response.json()
    },
    onSuccess: (_, listingId) => {
      // Update the favourites list
      queryClient.setQueryData(['favourites'], (old: string[] = []) => {
        return old.filter(id => id !== listingId)
      })
      
      // Also invalidate the favourites page data if it exists
      queryClient.invalidateQueries({ queryKey: ['favourites-full'] })
    },
  })

  // Toggle favourite
  const toggleFavourite = async (listingId: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    const isFavourite = favouriteIds.includes(listingId)
    
    if (isFavourite) {
      await removeFavourite.mutateAsync(listingId)
    } else {
      await addFavourite.mutateAsync(listingId)
    }
  }

  return {
    favouriteIds,
    isLoading,
    toggleFavourite,
    addFavourite: addFavourite.mutate,
    removeFavourite: removeFavourite.mutate,
    isToggling: addFavourite.isPending || removeFavourite.isPending,
  }
}