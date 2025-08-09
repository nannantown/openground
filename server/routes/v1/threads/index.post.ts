import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'
import { z } from 'zod'
import { defineEventHandler, setResponseStatus, readBody } from 'h3'

const bodySchema = z.object({ listing_id: z.string().uuid(), partner_id: z.string().uuid() })

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    setResponseStatus(event, 400)
    return { error: 'Invalid body' }
  }
  const supabase = getSupabaseServerClient(event)

  const { data: thread, error: terr } = await supabase
    .from('threads')
    .insert({})
    .select('*')
    .single()
  if (terr) {
    setResponseStatus(event, 400)
    return { error: terr.message }
  }

  const { error: perr } = await supabase.from('participants').insert([
    { thread_id: thread.id, user_id: user.id },
    { thread_id: thread.id, user_id: parsed.data.partner_id },
  ])
  if (perr) {
    setResponseStatus(event, 400)
    return { error: perr.message }
  }

  return { thread_id: thread.id }
})
