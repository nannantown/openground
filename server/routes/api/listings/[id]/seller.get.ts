import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { getSupabaseServerClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    setResponseStatus(event, 400)
    return { error: 'id required' }
  }
  const supabase = getSupabaseServerClient(event)
  const { data: listing, error: lerr } = await supabase.from('listings').select('owner_id').eq('id', id).single()
  if (lerr || !listing) {
    setResponseStatus(event, 404)
    return { error: 'Listing not found' }
  }
  const ownerId: string = listing.owner_id
  const [{ data: user, error: uerr }, { data: revs, error: rerr }] = await Promise.all([
    supabase.from('users').select('id, display_name, avatar_url, created_at').eq('id', ownerId).single(),
    supabase.from('reviews').select('rating').eq('to_uid', ownerId),
  ])
  if (uerr) {
    setResponseStatus(event, 400)
    return { error: uerr.message }
  }
  const ratings = (revs || []).map((r: any) => Number(r.rating)).filter((n) => !Number.isNaN(n))
  const reviewCount = ratings.length
  const ratingAverage = reviewCount ? ratings.reduce((a, b) => a + b, 0) / reviewCount : null
  return {
    id: user?.id,
    display_name: user?.display_name,
    avatar_url: user?.avatar_url,
    member_since: user?.created_at,
    review_count: reviewCount,
    rating_average: ratingAverage,
  }
})


