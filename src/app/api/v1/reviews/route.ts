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
        reviewer:users!reviewer_id (
          id,
          display_name,
          avatar_url
        ),
        reviewee:users!reviewee_id (
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
      query = query.eq('reviewee_id', userId)
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
    const { reviewee_id, listing_id, rating, comment, transaction_type } = body

    // Validate required fields
    if (!reviewee_id || !listing_id || !rating || !transaction_type) {
      return NextResponse.json({ 
        error: 'reviewee_id, listing_id, rating, and transaction_type are required' 
      }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    if (!['buyer_to_seller', 'seller_to_buyer'].includes(transaction_type)) {
      return NextResponse.json({ 
        error: 'transaction_type must be buyer_to_seller or seller_to_buyer' 
      }, { status: 400 })
    }

    // Can't review yourself
    if (reviewee_id === user.id) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
    }

    // Check if user can review (using database function)
    const { data: canReview, error: permError } = await supabase
      .rpc('can_user_review', {
        p_reviewer_id: user.id,
        p_reviewee_id: reviewee_id,
        p_listing_id: listing_id,
        p_transaction_type: transaction_type
      })

    if (permError) {
      console.error('Permission check error:', permError)
      return NextResponse.json({ 
        error: 'Unable to verify review permissions' 
      }, { status: 500 })
    }

    if (!canReview) {
      return NextResponse.json({ 
        error: 'You can only review users you have completed transactions with' 
      }, { status: 403 })
    }

    // Check for duplicate review
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('reviewee_id', reviewee_id)
      .eq('listing_id', listing_id)
      .eq('transaction_type', transaction_type)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Review check error:', checkError)
    }

    if (existingReview) {
      return NextResponse.json({ 
        error: 'You have already reviewed this user for this transaction' 
      }, { status: 400 })
    }

    // Create review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        reviewer_id: user.id,
        reviewee_id,
        listing_id,
        rating,
        comment: comment?.trim() || null,
        transaction_type
      })
      .select(`
        *,
        reviewer:users!reviewer_id (
          id,
          display_name,
          avatar_url
        ),
        reviewee:users!reviewee_id (
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