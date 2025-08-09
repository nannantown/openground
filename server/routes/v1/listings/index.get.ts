import { z } from 'zod'
import { searchSchema } from '~~/shared/validation'
import { getSupabaseServerClient } from '~~/server/utils/supabase'
import { defineEventHandler, getQuery, setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const parsed = searchSchema.safeParse(q)
  if (!parsed.success) {
    setResponseStatus(event, 400)
    return { error: 'Invalid query' }
  }
  const supabase = getSupabaseServerClient(event)
  const params = parsed.data

  const { data, error } = await supabase.rpc('rpc_search_listings', {
    q: params.q ?? null,
    cat: params.cat ?? null,
    min_price: params.min_price ?? null,
    max_price: params.max_price ?? null,
    center_lat: params.center_lat ?? null,
    center_lng: params.center_lng ?? null,
    radius_km: params.radius_km ?? 50,
  })

  if (!error) {
    return data
  }

  // Fallback query if RPC not yet visible in PostgREST cache
  const needsFallback = /function .*rpc_search_listings.* schema cache/i.test(error.message)
  if (needsFallback) {
    let qb = supabase.from('listings').select('*').eq('status', 'active')
    if (params.q) {
      // basic title/description ilike OR
      qb = qb.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
    }
    if (params.cat) qb = qb.eq('category', params.cat)
    if (params.min_price != null) qb = qb.gte('price', params.min_price)
    if (params.max_price != null) qb = qb.lte('price', params.max_price)
    qb = qb.order('created_at', { ascending: false })
    const { data: rows, error: qerr } = await qb
    if (qerr) {
      setResponseStatus(event, 500)
      return { error: qerr.message }
    }
    return rows
  }

  setResponseStatus(event, 500)
  return { error: error.message }
})
