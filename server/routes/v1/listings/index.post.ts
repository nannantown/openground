import { z } from 'zod'
import { createListingSchema } from '~~/shared/validation'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'
import { defineEventHandler, setResponseStatus, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const body = await readBody(event)
  const parsed = createListingSchema.safeParse(body)
  if (!parsed.success) {
    setResponseStatus(event, 400)
    return { error: 'Invalid body' }
  }
  const supabase = getSupabaseServerClient(event)
  const payload = parsed.data
  const { data, error } = await supabase
    .from('listings')
    .insert({
      owner_id: user.id,
      title: payload.title,
      description: payload.description ?? null,
      price: payload.price ?? null,
      category: payload.category ?? null,
      lat: payload.lat ?? null,
      lng: payload.lng ?? null,
      images: payload.images ?? [],
    })
    .select('*')
    .single()

  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }

  return data
})
