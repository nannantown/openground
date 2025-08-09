import { defineEventHandler, getRouterParam, readBody, setResponseStatus } from 'h3'
import { getSupabaseServerClient, getSupabaseUser } from '~~/server/utils/supabase'

type UpdatePayload = {
  title?: string
  description?: string
  price?: number | null
  category?: string | null
  images?: string[]
  lat?: number | null
  lng?: number | null
}

export default defineEventHandler(async (event) => {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' }
  }
  const id = getRouterParam(event, 'id')
  if (!id) {
    setResponseStatus(event, 400)
    return { error: 'id required' }
  }
  const body = (await readBody(event)) as UpdatePayload
  const supabase = getSupabaseServerClient(event)

  const patch: Record<string, any> = {}
  for (const k of ['title', 'description', 'price', 'category', 'images', 'lat', 'lng'] as const) {
    if (k in body) (patch as any)[k] = (body as any)[k]
  }
  if (Object.keys(patch).length === 0) return { ok: true }

  const { error } = await supabase
    .from('listings')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', user.id)
  if (error) {
    setResponseStatus(event, 400)
    return { error: error.message }
  }
  return { ok: true }
})


