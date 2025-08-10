import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.warn('Supabase URL or API key not found, using placeholder values')
    // Return a mock client for build time
    return createBrowserClient(
      'https://placeholder.supabase.co', 
      'placeholder-key'
    )
  }
  
  return createBrowserClient(url, key)
}