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
    .from('participants')
    .select('thread_id, threads(id,last_message,updated_at)')
    .eq('user_id', user.id)
    .order('threads(updated_at)', { ascending: false })
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  const threads = (data || [])
    .map((r: any) => r.threads)
    .filter(Boolean)
  return threads
})


