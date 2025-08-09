// Edge Function: cleanup_expired
// Placeholder: daily cron to set status='expired'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

serve(async () => {
  console.log('cleanup_expired tick')
  return new Response('ok', { status: 200 })
})

