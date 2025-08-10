import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: threadId } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Check if user is a participant in this thread
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return new Response('Access denied', { status: 403 })
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({ type: 'connected', threadId })}\n\n`
        controller.enqueue(new TextEncoder().encode(data))

        // Set up Supabase real-time subscription
        const channel = supabase
          .channel(`messages:${threadId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'messages',
              filter: `thread_id=eq.${threadId}`,
            },
            async (payload) => {
              try {
                // Get the full message data with sender info
                const { data: message, error: messageError } = await supabase
                  .from('messages')
                  .select(`
                    *,
                    sender:users!sender_id (
                      id,
                      display_name,
                      avatar_url
                    )
                  `)
                  .eq('id', payload.new.id)
                  .single()

                if (!messageError && message) {
                  const eventData = `data: ${JSON.stringify(message)}\n\n`
                  controller.enqueue(new TextEncoder().encode(eventData))
                }
              } catch (error) {
                console.error('Error processing real-time message:', error)
              }
            }
          )
          .subscribe()

        // Handle connection cleanup
        const cleanup = () => {
          channel.unsubscribe()
          controller.close()
        }

        // Clean up when the connection is closed
        request.signal?.addEventListener('abort', cleanup)
        
        // Keep connection alive with periodic heartbeats
        const heartbeat = setInterval(() => {
          try {
            const heartbeatData = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`
            controller.enqueue(new TextEncoder().encode(heartbeatData))
          } catch (error) {
            clearInterval(heartbeat)
            cleanup()
          }
        }, 30000) // Send heartbeat every 30 seconds

        // Cleanup heartbeat when connection closes
        request.signal?.addEventListener('abort', () => {
          clearInterval(heartbeat)
        })
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })
  } catch (error) {
    console.error('Stream API error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}