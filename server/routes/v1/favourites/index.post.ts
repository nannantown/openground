import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const { listing_id } = await readBody<{ listing_id?: string }>(event)
  if (!listing_id) {
    setResponseStatus(event, 400)
    return { error: 'listing_id required' }
  }
  const supabase = getSupabaseServerClient(event)
  const { error } = await supabase.from('favourites').insert({ user_id: user.id, listing_id })
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return { ok: true }
})


