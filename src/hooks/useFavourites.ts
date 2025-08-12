'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'

export function useFavourites() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Get user's favourite listing IDs
  const { data: favouriteIds = [], isLoading } = useQuery<string[]>({
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
    staleTime: 1 * 60 * 1000, // 1 minute - reduced for better sync
    gcTime: 10 * 60 * 1000, // 10 minutes cache
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
    // Optimistic update
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: ['favourites'] })
      const previousFavourites = queryClient.getQueryData(['favourites'])
      
      queryClient.setQueryData(['favourites'], (old: string[] = []) => {
        if (!old.includes(listingId)) {
          return [...old, listingId]
        }
        return old
      })
      
      return { previousFavourites }
    },
    onError: (err, listingId, context) => {
      if (context?.previousFavourites) {
        queryClient.setQueryData(['favourites'], context.previousFavourites)
      }
    },
    onSuccess: (_, listingId) => {
      // Update the favourites list
      queryClient.setQueryData(['favourites'], (old: string[] = []) => {
        if (!old.includes(listingId)) {
          return [...old, listingId]
        }
        return old
      })
      
      // Invalidate all related queries to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['favourites-full'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] }) // Update main listings page
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
    // Optimistic update
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: ['favourites'] })
      const previousFavourites = queryClient.getQueryData(['favourites'])
      
      queryClient.setQueryData(['favourites'], (old: string[] = []) => {
        return old.filter(id => id !== listingId)
      })
      
      return { previousFavourites }
    },
    onError: (err, listingId, context) => {
      if (context?.previousFavourites) {
        queryClient.setQueryData(['favourites'], context.previousFavourites)
      }
    },
    onSuccess: (_, listingId) => {
      // Update the favourites list
      queryClient.setQueryData(['favourites'], (old: string[] = []) => {
        return old.filter(id => id !== listingId)
      })
      
      // Invalidate all related queries to ensure UI consistency
      queryClient.invalidateQueries({ queryKey: ['favourites-full'] })
      queryClient.invalidateQueries({ queryKey: ['listings'] }) // Update main listings page
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