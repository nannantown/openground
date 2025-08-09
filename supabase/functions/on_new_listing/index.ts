// Edge Function: on_new_listing
// Placeholder: notify followers; prepare search cache
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  const payload = await req.json().catch(() => null)
  console.log('on_new_listing', payload)
  return new Response('ok', { status: 200 })
})

