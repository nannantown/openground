import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const body = await readBody<{ target_id: string; target_type: string; reason?: string }>(event)
  if (!body?.target_id || !body?.target_type) {
    setResponseStatus(event, 400)
    return { error: 'target_id and target_type required' }
  }
  const supabase = getSupabaseServerClient(event)
  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    target_id: body.target_id,
    target_type: body.target_type,
    reason: body.reason ?? '',
  })
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return { ok: true }
})


