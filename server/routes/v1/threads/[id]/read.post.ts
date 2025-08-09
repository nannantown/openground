import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const threadId = getRouterParam(event, 'id')
  if (!threadId) {
    setResponseStatus(event, 400)
    return { error: 'id required' }
  }
  const supabase = getSupabaseServerClient(event)
  // Fetch recent messages in the thread
  const { data: msgs, error } = await supabase
    .from('messages')
    .select('id, read_by')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  const toUpdate = (msgs || []).filter((m: any) => !Array.isArray(m.read_by) || !m.read_by.includes(user.id))
  for (const m of toUpdate) {
    const next = Array.isArray(m.read_by) ? Array.from(new Set([...m.read_by, user.id])) : [user.id]
    // Best-effort: ignore single-row failures
    await supabase.from('messages').update({ read_by: next }).eq('id', m.id)
  }
  return { ok: true, updated: toUpdate.length }
})


