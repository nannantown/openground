export type UUID = string

// Database enum types for type safety
export type ListingStatus = 'active' | 'sold' | 'expired'
export type ThreadStatus = 'open' | 'closed'

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

