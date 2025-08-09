import { defineEventHandler, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const supabase = getSupabaseServerClient(event)
  const display = user.user_metadata?.name || user.email?.split('@')[0] || 'user'
  const avatar = user.user_metadata?.avatar_url || null
  const { error } = await supabase
    .from('users')
    .upsert({ id: user.id, display_name: display, avatar_url: avatar }, { onConflict: 'id' })
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return { ok: true }
})


