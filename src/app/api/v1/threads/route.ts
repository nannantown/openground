import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get threads where user is a participant
    const { data: threads, error } = await supabase
      .from('threads')
      .select(`
        *,
        listing:listings!listing_id (
          id,
          title,
          price,
          images,
          owner_id
        ),
        participants:participants!thread_id (
          user:users!user_id (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .in('id', 
        // Subquery to get thread IDs where user is a participant
        supabase
          .from('participants')
          .select('thread_id')
          .eq('user_id', user.id)
      )
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch threads' }, { status: 500 })
    }

    return NextResponse.json(threads || [], {
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
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { listing_id, message } = body

    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
    }

    // Get the listing to find the owner
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Don't allow creating thread with yourself
    if (listing.owner_id === user.id) {
      return NextResponse.json({ error: 'Cannot create thread with yourself' }, { status: 400 })
    }

    // Check if thread already exists between these users for this listing
    const { data: existingThread, error: threadCheckError } = await supabase
      .from('threads')
      .select('id')
      .eq('listing_id', listing_id)
      .in('id', 
        // Subquery to find threads where both users are participants
        supabase
          .from('participants')
          .select('thread_id')
          .in('user_id', [user.id, listing.owner_id])
      )
      .limit(1)
      .single()

    if (threadCheckError && threadCheckError.code !== 'PGRST116') {
      console.error('Thread check error:', threadCheckError)
    }

    // If thread exists, return it
    if (existingThread) {
      const { data: thread, error: fetchError } = await supabase
        .from('threads')
        .select(`
          *,
          listing:listings!listing_id (
            id,
            title,
            price,
            images,
            owner_id
          ),
          participants:participants!thread_id (
            user:users!user_id (
              id,
              display_name,
              avatar_url
            )
          )
        `)
        .eq('id', existingThread.id)
        .single()

      if (fetchError) {
        console.error('Fetch thread error:', fetchError)
        return NextResponse.json({ error: 'Failed to fetch thread' }, { status: 500 })
      }

      return NextResponse.json(thread)
    }

    // Create new thread
    const { data: newThread, error: createError } = await supabase
      .from('threads')
      .insert({
        listing_id,
        last_message: message || ''
      })
      .select()
      .single()

    if (createError) {
      console.error('Create thread error:', createError)
      return NextResponse.json({ error: 'Failed to create thread' }, { status: 500 })
    }

    // Add participants
    const { error: participantsError } = await supabase
      .from('participants')
      .insert([
        { thread_id: newThread.id, user_id: user.id },
        { thread_id: newThread.id, user_id: listing.owner_id }
      ])

    if (participantsError) {
      console.error('Add participants error:', participantsError)
      return NextResponse.json({ error: 'Failed to add participants' }, { status: 500 })
    }

    // If initial message provided, create it
    if (message) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          thread_id: newThread.id,
          sender_id: user.id,
          body: message
        })

      if (messageError) {
        console.error('Create message error:', messageError)
        // Don't fail the thread creation if message fails
      }
    }

    // Fetch the complete thread data
    const { data: completeThread, error: fetchCompleteError } = await supabase
      .from('threads')
      .select(`
        *,
        listing:listings!listing_id (
          id,
          title,
          price,
          images,
          owner_id
        ),
        participants:participants!thread_id (
          user:users!user_id (
            id,
            display_name,
            avatar_url
          )
        )
      `)
      .eq('id', newThread.id)
      .single()

    if (fetchCompleteError) {
      console.error('Fetch complete thread error:', fetchCompleteError)
      return NextResponse.json({ error: 'Thread created but failed to fetch details' }, { status: 500 })
    }

    return NextResponse.json(completeThread, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}