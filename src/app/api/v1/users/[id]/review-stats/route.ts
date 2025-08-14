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

    // Validate user ID
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Try to fetch review statistics for the specified user
    const { data: stats, error } = await supabase
      .from('user_review_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      // If table doesn't exist or no stats found, calculate from reviews table
      if (error.code === 'PGRST116' || error.message.includes('schema cache')) {
        console.log('user_review_stats table not found, calculating from reviews...')
        
        // Calculate stats from reviews table
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('rating')
          .eq('reviewee_id', userId)
        
        if (reviewsError) {
          console.log('Reviews table also not available, returning default stats')
          return NextResponse.json({
            user_id: userId,
            average_rating: 0,
            total_reviews: 0,
            rating_5_count: 0,
            rating_4_count: 0,
            rating_3_count: 0,
            rating_2_count: 0,
            rating_1_count: 0,
            updated_at: new Date().toISOString()
          }, {
            headers: {
              'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            }
          })
        }
        
        // Calculate statistics
        const totalReviews = reviews?.length || 0
        const ratings = reviews?.map(r => r.rating) || []
        const averageRating = totalReviews > 0 ? ratings.reduce((a, b) => a + b, 0) / totalReviews : 0
        
        return NextResponse.json({
          user_id: userId,
          average_rating: Number(averageRating.toFixed(2)),
          total_reviews: totalReviews,
          rating_5_count: ratings.filter(r => r === 5).length,
          rating_4_count: ratings.filter(r => r === 4).length,
          rating_3_count: ratings.filter(r => r === 3).length,
          rating_2_count: ratings.filter(r => r === 2).length,
          rating_1_count: ratings.filter(r => r === 1).length,
          updated_at: new Date().toISOString()
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          }
        })
      }
      
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch review stats' }, { status: 500 })
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}