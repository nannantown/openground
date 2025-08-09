import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'
import { z } from 'zod'
import { defineEventHandler, setResponseStatus, getRouterParam, readBody } from 'h3'

const schema = z.object({
  body: z.string().optional().nullable(),
  image_urls: z.array(z.string().url()).optional(),
})

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const threadId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    setResponseStatus(event, 400)
    return { error: 'Invalid body' }
  }
  const supabase = getSupabaseServerClient(event)
  const payload = parsed.data

  const { data, error } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      body: payload.body ?? null,
      image_urls: payload.image_urls ?? [],
    })
    .select('*')
    .single()
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }

  await supabase
    .from('threads')
    .update({ last_message: payload.body ?? null })
    .eq('id', threadId)

  return data
})
