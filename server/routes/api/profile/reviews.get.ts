import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { getSupabaseServerClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const uid = String(q.uid || '')
  if (!uid) {
    setResponseStatus(event, 400)
    return { error: 'uid required' }
  }
  const supabase = getSupabaseServerClient(event)
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at')
    .eq('to_uid', uid)
    .order('created_at', { ascending: false })
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return data || []
})


