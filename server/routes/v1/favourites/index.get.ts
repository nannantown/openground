import { defineEventHandler, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const supabase = getSupabaseServerClient(event)
  const { data, error } = await supabase.from('favourites').select('listing_id').eq('user_id', user.id)
  if (error) {
    setResponseStatus(event, 500)
    return { error: error.message }
  }
  return (data || []).map((r: any) => r.listing_id)
})


