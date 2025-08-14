import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-helpers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    // ゲストユーザー対応の認証チェック
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ゲストユーザーも通常のSupabaseユーザーとして処理するため、ここでの特別な処理は不要
    // if (user.isGuest) {
    //   return NextResponse.json([], {
    //     headers: {
    //       'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
    //     }
    //   })
    // }

    const supabase = await createClient()

    let threadIds = []
    
    // ゲストユーザーの場合は空の配列を返すか、特別処理をする
    if (user.isGuest) {
      // ゲストユーザー用のモックスレッドデータを返すか、空を返す
      return NextResponse.json([])
    } else {
      // First, get thread IDs where user is a participant
      const { data: participantThreads, error: participantError } = await supabase
        .from('participants')
        .select('thread_id')
        .eq('user_id', user.id)
      
      if (participantError) {
        return NextResponse.json({ error: 'Failed to fetch participant threads' }, { status: 500 })
      }
      
      threadIds = participantThreads?.map(p => p.thread_id) || []
      
      if (threadIds.length === 0) {
        return NextResponse.json([])
      }
    }

    // Get threads where user is a participant
    // Note: Can't use listing foreign key since listing_id column doesn't exist
    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        *,
        participants:participants!thread_id (
          user:users!user_id (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .in('id', threadIds)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }

    // Calculate unread count for each thread
    const threadsWithUnreadCount = await Promise.all(
      (threads || []).map(async (thread) => {
        // Get all messages in this thread and filter unread ones in JavaScript
        const { data: threadMessages, error: countError } = await supabase
          .from('messages')
          .select('read_by')
          .eq('thread_id', thread.id)
        
        const unreadCount = (threadMessages || []).filter(message => {
          const readBy = Array.isArray(message.read_by) ? message.read_by : []
          return !readBy.includes(user.id)
        }).length

        if (countError) {
          console.error('Unread count error:', countError)
          return { ...thread, unread_count: 0 }
        }

        return { ...thread, unread_count: unreadCount || 0 }
      })
    )

    return NextResponse.json(threadsWithUnreadCount, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // ゲストユーザー対応の認証チェック
    const { user, error: authError } = await getAuthUser(request)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const body = await request.json()
    const { listing_id, message } = body

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
    }

    // Get the listing to find the owner
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('owner_id, title, price, images')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Don't allow creating thread with yourself
    if (listing.owner_id === user.id) {
      return NextResponse.json({ error: 'Cannot create thread with yourself' }, { status: 400 })
    }

    // Simplified approach: Always try to create a new thread
    // Since listing_id column doesn't exist, we'll work with the basic schema

    // Create new thread (without listing_id since it doesn't exist in current schema)
    const { data: newThread, error: createError } = await supabase
      .from('threads')
      .insert({
        last_message: message || ''
      })
      .select()
      .single()

    if (createError) {
      console.error('Create thread error:', createError)
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
    }

    // Add participants now that RLS is fixed
    // ゲストユーザーの場合は特別処理
    if (!user.isGuest) {
      const { error: userParticipantError } = await supabase
        .from('participants')
        .insert({ thread_id: newThread.id, user_id: user.id })

      if (userParticipantError) {
        console.error('Add user participant error:', userParticipantError)
        return NextResponse.json({ error: 'Failed to add user as participant' }, { status: 500 })
      }
    }

    // Add owner as participant
    const { error: ownerParticipantError } = await supabase
      .from('participants')
      .insert({ thread_id: newThread.id, user_id: listing.owner_id })

    if (ownerParticipantError) {
      console.error('Add owner participant error:', ownerParticipantError)
      return NextResponse.json({ error: 'Failed to add owner as participant' }, { status: 500 })
    }

    // If initial message provided, create it with listing context
    if (message && !user.isGuest) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: newThread.id,
          sender_id: user.id,
          body: `[Listing: ${listing_id}] ${message}`
        })

      if (messageError) {
        console.error('Create message error:', messageError)
        // Don't fail the thread creation if message fails
      }
    }

    // Since we can't use foreign key relations without listing_id column,
    // we'll return the basic thread data and let the frontend handle the rest
    const result = {
      id: newThread.id,
      last_message: newThread.last_message,
      updated_at: newThread.updated_at,
      listing_id: listing_id, // Include this in the response even though not in DB
      listing: {
        id: listing_id,
        title: listing.title || 'Unknown Listing',
        price: listing.price,
        images: listing.images || [],
        owner_id: listing.owner_id
      },
      participants: [
        { user: { id: user.id, display_name: 'You', avatar_url: null } },
        { user: { id: listing.owner_id, display_name: 'Owner', avatar_url: null } }
      ]
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}