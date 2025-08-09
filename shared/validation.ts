import { z } from 'zod'

export const createListingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative().optional().nullable(),
  category: z.string().optional().nullable(),
  lat: z.coerce.number().optional().nullable(),
  lng: z.coerce.number().optional().nullable(),
  images: z.array(z.string().url()).default([]),
})

export const searchSchema = z.object({
  q: z.string().optional(),
  cat: z.string().optional(),
  min_price: z.coerce.number().optional(),
  max_price: z.coerce.number().optional(),
  center_lat: z.coerce.number().optional(),
  center_lng: z.coerce.number().optional(),
  radius_km: z.coerce.number().optional(),
})

export type CreateListingInput = z.infer<typeof createListingSchema>
export type SearchListingsInput = z.infer<typeof searchSchema>

