// Edge Function: on_new_message
// Placeholder: broadcast via Realtime; push FCM `thread_{id}`
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  const payload = await req.json().catch(() => null)
  console.log('on_new_message', payload)
  return new Response('ok', { status: 200 })
})

