import { defineNuxtPlugin, useRuntimeConfig } from '#app'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  // @nuxtjs/supabase module handles client creation via runtime config.
  // This plugin exists to ensure module is initialized early in client.
  const url = (config.public as any).supabase?.url || (config.public as any).supabaseUrl
  const key = (config.public as any).supabase?.key || (config.public as any).supabaseAnonKey
  if (!url || !key) {
    // eslint-disable-next-line no-console
    console.warn('[supabase] missing supabaseUrl or supabaseAnonKey')
  }
})
