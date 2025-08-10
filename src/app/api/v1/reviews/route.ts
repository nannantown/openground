import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const userId = searchParams.get('user_id')
    const listingId = searchParams.get('listing_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('reviews')
      .select(`
        *,
        from_user:users!from_uid (
          id,
          display_name,
          avatar_url
        ),
        to_user:users!to_uid (
          id,
          display_name,
          avatar_url
        ),
        listing:listings!listing_id (
          id,
          title
        )
      `)

    if (userId) {
      query = query.eq('to_uid', userId)
    }

    if (listingId) {
      query = query.eq('listing_id', listingId)
    }

    const { data: reviews, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    return NextResponse.json(reviews || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
    const { to_uid, listing_id, rating, comment } = body

    // Validate required fields
    if (!to_uid || !rating) {
      return NextResponse.json({ error: 'to_uid and rating are required' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Can't review yourself
    if (to_uid === user.id) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
    }

    // Check if user already reviewed this person for this listing
    if (listing_id) {
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('from_uid', user.id)
        .eq('to_uid', to_uid)
        .eq('listing_id', listing_id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Review check error:', checkError)
      }

      if (existingReview) {
        return NextResponse.json({ error: 'You have already reviewed this user for this listing' }, { status: 400 })
      }
    }

    // Verify the target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', to_uid)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    // If listing_id provided, verify it exists
    if (listing_id) {
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id')
        .eq('id', listing_id)
        .single()

      if (listingError || !listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
      }
    }

    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        from_uid: user.id,
        to_uid,
        listing_id,
        rating,
        comment
      })
      .select(`
        *,
        from_user:users!from_uid (
          id,
          display_name,
          avatar_url
        ),
        to_user:users!to_uid (
          id,
          display_name,
          avatar_url
        ),
        listing:listings!listing_id (
          id,
          title
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 })
    }

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}