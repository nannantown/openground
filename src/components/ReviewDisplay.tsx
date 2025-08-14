'use client'

import { useQuery } from '@tanstack/react-query'
import { Star, MessageCircle, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Review, UserReviewStats, UUID } from '@/shared/types'

interface ReviewDisplayProps {
  userId: UUID
  showForm?: boolean
}

interface ReviewWithReviewer extends Review {
  reviewer: {
    id: string
    display_name: string
    avatar_url: string | null
  }
  listing: {
    title: string
  }
}

export function ReviewDisplay({ userId, showForm = false }: ReviewDisplayProps) {
  // Fetch user review statistics
  const { data: stats } = useQuery({
    queryKey: ['user-review-stats', userId],
    queryFn: async (): Promise<UserReviewStats> => {
      const response = await fetch(`/api/v1/users/${userId}/review-stats`)
      if (!response.ok) {
        throw new Error('Failed to fetch review stats')
      }
      return response.json()
    },
  })

  // Fetch user reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['user-reviews', userId],
    queryFn: async (): Promise<ReviewWithReviewer[]> => {
      const response = await fetch(`/api/v1/users/${userId}/reviews`)
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      return response.json()
    },
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const starSize = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      {stats && stats.total_reviews > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              評価概要
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.average_rating.toFixed(1)}
                </div>
                {renderStars(Math.round(stats.average_rating), 'lg')}
              </div>
              <div className="text-sm text-gray-600">
                <p>{stats.total_reviews}件のレビュー</p>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats[`rating_${rating}_count` as keyof UserReviewStats] as number
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0
                
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-3">{rating}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-gray-600">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual Reviews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          レビュー
          {reviews && reviews.length > 0 && (
            <span className="text-sm text-gray-600">({reviews.length}件)</span>
          )}
        </h3>

        {!reviews || reviews.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>まだレビューがありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} data-testid={`review-${review.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {review.reviewer.avatar_url ? (
                        <img
                          src={review.reviewer.avatar_url}
                          alt={review.reviewer.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {review.reviewer.display_name}
                        </h4>
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        商品: {review.listing.title}
                      </p>
                      
                      {review.comment && (
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {review.comment}
                        </p>
                      )}
                      
                      <div className="mt-2 text-xs text-gray-500">
                        {review.transaction_type === 'buyer_to_seller' ? '購入者からの評価' : '出品者からの評価'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Star Rating component for reuse
export function StarRating({ 
  rating, 
  size = 'sm',
  showNumber = false 
}: { 
  rating: number
  size?: 'sm' | 'lg'
  showNumber?: boolean 
}) {
  const starSize = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
      {showNumber && (
        <span className="ml-1 text-sm text-gray-600">
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}