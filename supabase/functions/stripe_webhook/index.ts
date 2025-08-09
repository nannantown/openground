// Edge Function: stripe_webhook
// Placeholder: set listings.promoted_type after payment succeeded
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async (req) => {
  const payload = await req.text()
  console.log('stripe_webhook', payload.slice(0, 256))
  return new Response('ok', { status: 200 })
})

