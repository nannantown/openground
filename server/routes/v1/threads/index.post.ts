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

  // Reuse existing thread if already present for these two users
  const { data: existing, error: eerr } = await supabase
    .from('participants')
    .select('thread_id')
    .in('user_id', [user.id, parsed.data.partner_id])
  if (!eerr && existing) {
    const counts: Record<string, number> = {}
    for (const r of existing as any[]) counts[r.thread_id] = (counts[r.thread_id] || 0) + 1
    const found = Object.entries(counts).find(([, c]) => c >= 2)
    if (found) {
      return { thread_id: found[0] }
    }
  }

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
