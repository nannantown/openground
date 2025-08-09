import type { H3Event } from 'h3'
import { setResponseStatus } from 'h3'
import { useRuntimeConfig } from '#imports'
import { getSupabaseUser } from '~~/server/utils/supabase'

export async function requireAdmin(event: H3Event) {
  const user = await getSupabaseUser(event)
  if (!user) {
    setResponseStatus(event, 401)
    return { error: 'Unauthorized' } as const
  }
  const config = useRuntimeConfig() as any
  const emailsCsv = (config.adminEmails as string) || ''
  const admins = emailsCsv
    .split(',')
    .map((s: string) => s.trim().toLowerCase())
    .filter(Boolean)
  const isAdmin = user.email && admins.includes(user.email.toLowerCase())
  if (!isAdmin) {
    setResponseStatus(event, 403)
    return { error: 'Forbidden' } as const
  }
  return { ok: true as const, user }
}


