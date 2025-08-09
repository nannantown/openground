import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'
import { defineEventHandler, setResponseStatus, getRouterParam, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const threadId = getRouterParam(event, 'id')
  const after = getQuery(event).after as string | undefined
  const supabase = getSupabaseServerClient(event)

  let query = supabase
    .from('messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (after) query = query.gt('created_at', after)

  const { data, error } = await query
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return data
})
