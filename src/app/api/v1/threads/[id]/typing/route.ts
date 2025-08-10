import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: threadId } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a participant in this thread
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { is_typing } = body

    // In a real implementation, you'd want to use a real-time system like Redis
    // or Supabase realtime to broadcast typing indicators
    // For now, we'll just acknowledge the request
    
    // You could store typing status in a separate table or use Supabase channels
    // to broadcast typing events to other participants

    return NextResponse.json({ 
      success: true,
      user_id: user.id,
      thread_id: threadId,
      is_typing,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Typing API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}