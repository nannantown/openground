import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: userId } = await params

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get user statistics
    const [
      { count: listingsCount },
      { data: reviews, error: reviewsError },
    ] = await Promise.all([
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)
        .eq('status', 'active'),
      
      supabase
        .from('reviews')
        .select('rating')
        .eq('to_uid', userId)
    ])

    // Calculate average rating
    let averageRating = null
    if (reviews && reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      averageRating = Math.round((totalRating / reviews.length) * 10) / 10
    }

    const userProfile = {
      ...user,
      stats: {
        active_listings: listingsCount || 0,
        total_reviews: reviews?.length || 0,
        average_rating: averageRating
      }
    }

    return NextResponse.json(userProfile, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: userId } = await params
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Can only update own profile
    if (user.id !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { display_name, avatar_url, phone } = body

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ...(display_name !== undefined && { display_name }),
        ...(avatar_url !== undefined && { avatar_url }),
        ...(phone !== undefined && { phone }),
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}