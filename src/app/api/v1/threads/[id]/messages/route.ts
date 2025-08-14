import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params
    
    // ゲストユーザー対応の認証チェック
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // ゲストユーザーの場合は参加者チェックをスキップ
    if (!user.isGuest) {
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
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get messages for this thread
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Mark messages as read by current user (ゲストユーザーはスキップ)
    if (messages && messages.length > 0 && !user.isGuest) {
      const messageIds = messages.map(m => m.id)
      await supabase
        .from('messages')
        .update({
          read_by: supabase.rpc('array_append', {
            arr: 'read_by',
            elem: user.id
          })
        })
        .in('id', messageIds)
        .not('read_by', 'cs', `["${user.id}"]`) // Only update if not already read
    }

    return NextResponse.json(messages?.reverse() || [], {
      headers: {
        'Cache-Control': 'private, s-maxage=5, stale-while-revalidate=10',
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: threadId } = await params
    
    // ゲストユーザー対応の認証チェック
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // ゲストユーザーの場合は参加者チェックをスキップ
    if (!user.isGuest) {
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
    }

    const body = await request.json()
    const { message, image_urls = [] } = body

    if (!message && (!image_urls || image_urls.length === 0)) {
      return NextResponse.json({ error: 'Message or images required' }, { status: 400 })
    }

    // Create new message (ゲストユーザーの場合は特別処理)
    if (user.isGuest) {
      // ゲストユーザーはメッセージを作成できない（デモ用）
      return NextResponse.json({ error: 'Guest users cannot send messages in demo mode' }, { status: 403 })
    }

    const { data: newMessage, error } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        body: message,
        image_urls,
        read_by: [user.id] // Mark as read by sender
      })
      .select(`
        *,
        sender:users!sender_id (
          id,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 })
    }

    // The trigger will automatically update the thread's updated_at and last_message
    
    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}