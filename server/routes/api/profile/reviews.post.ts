import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const body = await readBody<{ to_uid: string; rating?: number; comment?: string }>(event)
  if (!body?.to_uid || !body?.rating) {
    setResponseStatus(event, 400)
    return { error: 'to_uid and rating required' }
  }
  const supabase = getSupabaseServerClient(event)
  const { error } = await supabase.from('reviews').insert({
    from_uid: user.id,
    to_uid: body.to_uid,
    rating: body.rating,
    comment: body.comment ?? '',
  })
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return { ok: true }
})


