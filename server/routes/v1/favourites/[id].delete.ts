import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const id = getRouterParam(event, 'id')
  if (!id) {
    setResponseStatus(event, 400)
    return { error: 'id required' }
  }
  const supabase = getSupabaseServerClient(event)
  const { error } = await supabase.from('favourites').delete().eq('user_id', user.id).eq('listing_id', id)
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return { ok: true }
})


