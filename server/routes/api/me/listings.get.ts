import { defineEventHandler, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const supabase = getSupabaseServerClient(event)
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return data || []
})


