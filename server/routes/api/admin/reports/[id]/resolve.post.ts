import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { getSupabaseServerClient } from '~~/server/utils/supabase'
import { requireAdmin } from '~~/server/utils/admin'

export default defineEventHandler(async (event) => {
  const auth = await requireAdmin(event)
  if ('error' in auth) return auth
  const id = getRouterParam(event, 'id')
  if (!id) {
    setResponseStatus(event, 400)
    return { error: 'id required' }
  }
  const supabase = getSupabaseServerClient(event)
  const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', id)
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return { ok: true }
})


