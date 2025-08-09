import { getSupabaseServerClient } from '~~/server/utils/supabase'
import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const supabase = getSupabaseServerClient(event)
  const { data, error } = await supabase.from('listings').select('*').eq('id', id).single()
  if (error) {
    setResponseStatus(event, 404)
    return { error: 'Not found' }
  }
  return data
})
