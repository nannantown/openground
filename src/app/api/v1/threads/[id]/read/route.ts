import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(
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

    const { id: threadId } = await params

    // Mark all messages in this thread as read by this user
    // Get all messages in this thread
    const { data: allMessages, error: fetchError } = await supabase
      .from('messages')
      .select('id, read_by')
      .eq('thread_id', threadId)
    
    if (fetchError) {
      console.error('Fetch messages error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
    
    // Filter messages that aren't already read by this user
    const unreadMessages = (allMessages || []).filter(message => {
      const readBy = Array.isArray(message.read_by) ? message.read_by : []
      return !readBy.includes(user.id)
    })
    
    // Update each unread message to add the user to read_by array
    for (const message of unreadMessages) {
      const currentReadBy = Array.isArray(message.read_by) ? message.read_by : []
      const updatedReadBy = [...currentReadBy, user.id]
      
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_by: updatedReadBy })
        .eq('id', message.id)
      
      if (updateError) {
        console.error('Update message read status error:', updateError)
        // Continue with other messages even if one fails
      }
    }


    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}