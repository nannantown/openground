import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const id = getRouterParam(event, 'id')
  const body = await readBody<{ status: 'active' | 'sold' | 'hidden' }>(event)
  if (!id || !body?.status) {
    setResponseStatus(event, 400)
    return { error: 'id and status required' }
  }
  const supabase = getSupabaseServerClient(event)
  const { error } = await supabase
    .from('listings')
    .update({ status: body.status })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return { ok: true }
})


