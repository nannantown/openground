export type UUID = string

// Database enum types for type safety
export type ListingStatus = 'active' | 'sold' | 'expired'
export type ThreadStatus = 'open' | 'closed'
export type TransactionType = 'buyer_to_seller' | 'seller_to_buyer'

export type User = {
  id: UUID
  display_name: string
  avatar_url: string | null
  phone: string | null
  is_verified: boolean
  created_at: string
}

export type Listing = {
  id: UUID
  owner_id: UUID
  title: string
  description: string | null
  price: number | null
  category: string | null
  condition: string | null
  location: string | null
  lat: number | null
  lng: number | null
  images: string[]
  status: ListingStatus
  promoted_type: 'none' | 'spotlight' | 'top'
  created_at: string
  expires_at: string
}

export type Thread = {
  id: UUID
  last_message: string | null
  updated_at: string
  unread_count?: number
}

export type Message = {
  id: UUID
  thread_id: UUID
  sender_id: UUID
  body: string | null
  image_urls: string[]
  created_at: string
  read_by: UUID[]
}

export type Review = {
  id: UUID
  reviewer_id: UUID
  reviewee_id: UUID
  listing_id: UUID
  rating: number
  comment: string | null
  transaction_type: TransactionType
  created_at: string
  updated_at: string
}

export type UserReviewStats = {
  user_id: UUID
  average_rating: number
  total_reviews: number
  rating_5_count: number
  rating_4_count: number
  rating_3_count: number
  rating_2_count: number
  rating_1_count: number
  updated_at: string
}

