import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: messageId } = await params

    // Get the message to verify ownership
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select('sender_id, thread_id')
      .eq('id', messageId)
      .single()

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Only allow deletion of own messages
    if (message.sender_id !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own messages' }, { status: 403 })
    }

    // Check if user is a participant in the thread
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .select('*')
      .eq('thread_id', message.thread_id)
      .eq('user_id', user.id)
      .single()

    if (participantError || !participant) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Soft delete the message by setting body to null and clearing images
    const { error: deleteError } = await supabase
      .from('messages')
      .update({
        body: null,
        image_urls: [],
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)

    if (deleteError) {
      console.error('Delete message error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}