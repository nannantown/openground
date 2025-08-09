import { getSupabaseServerClient } from '~~/server/utils/supabase'
import { defineEventHandler, getRequestURL, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const supabase = getSupabaseServerClient(event)
  const origin = getRequestURL(event).origin
  const { data } = await supabase
    .from('listings')
    .select('id, updated_at:created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  const urls = [`${origin}/`, ...(data || []).map((l: any) => `${origin}/listing/${l.id}`)]
  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map((u) => `<url><loc>${u}</loc></url>`).join('') +
    `</urlset>`
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})
