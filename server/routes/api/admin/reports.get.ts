import { defineEventHandler, setResponseStatus } from 'h3'
import { getSupabaseServerClient } from '~~/server/utils/supabase'
import { requireAdmin } from '~~/server/utils/admin'

export default defineEventHandler(async (event) => {
  const auth = await requireAdmin(event)
  if ('error' in auth) return auth
  const supabase = getSupabaseServerClient(event)
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return data || []
})


