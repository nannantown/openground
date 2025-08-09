import type { H3Event } from 'h3'
import { getCookie, setCookie } from 'h3'
import { useRuntimeConfig } from '#imports'
import { createServerClient } from '@supabase/ssr'

export function getSupabaseServerClient(event: H3Event) {
  const config = useRuntimeConfig() as any
  const url = config.public?.supabase?.url || config.public?.supabaseUrl || process.env.SUPABASE_URL
  const key =
    config.public?.supabase?.key || config.public?.supabaseAnonKey || process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase URL/Key not configured')

  return createServerClient(url, key, {
    cookies: {
      get: (name) => getCookie(event, name) ?? '',
      set: (name, value, options) => setCookie(event, name, value, { ...options, httpOnly: false }),
      remove: (name, options) => setCookie(event, name, '', { ...options, maxAge: 0 }),
    },
  })
}

export async function getSupabaseUser(event: H3Event) {
  const supabase = getSupabaseServerClient(event)
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}
