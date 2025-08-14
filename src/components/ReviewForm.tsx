'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MessageCircle, Loader2 } from 'lucide-react'
import type { TransactionType, UUID } from '@/shared/types'

interface ReviewFormProps {
  revieweeId: UUID
  revieweeName: string
  listingId: UUID
  listingTitle: string
  transactionType: TransactionType
  onSuccess?: () => void
  onCancel?: () => void
}

export function ReviewForm({
  revieweeId,
  revieweeName,
  listingId,
  listingTitle,
  transactionType,
  onSuccess,
  onCancel
}: ReviewFormProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('ログインが必要です')
      return
    }

    if (rating === 0) {
      setError('評価を選択してください')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewer_id: user.id,
          reviewee_id: revieweeId,
          listing_id: listingId,
          rating,
          comment: comment.trim() || null,
          transaction_type: transactionType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'レビューの投稿に失敗しました')
      }

      onSuccess?.()
    } catch (error) {
      console.error('Error submitting review:', error)
      setError(error instanceof Error ? error.message : 'レビューの投稿に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const transactionTypeLabel = transactionType === 'buyer_to_seller' ? '購入者として' : '出品者として'

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          レビューを投稿
        </CardTitle>
        <div className="text-sm text-gray-600">
          <p>{transactionTypeLabel}の評価</p>
          <p className="font-medium">{revieweeName}さん</p>
          <p className="text-xs">商品: {listingTitle}</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium mb-2">
              評価 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  data-testid={`star-${star}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {rating === 5 ? '最高' : rating === 4 ? '良い' : rating === 3 ? '普通' : rating === 2 ? '残念' : '最悪'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              コメント（任意）
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="取引の感想やフィードバックをお聞かせください..."
              maxLength={500}
              data-testid="review-comment"
            />
            <div className="text-xs text-gray-500 mt-1">
              {comment.length}/500文字
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1"
              variant="primary"
              data-testid="submit-review"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  投稿中...
                </>
              ) : (
                'レビューを投稿'
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                data-testid="cancel-review"
              >
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}