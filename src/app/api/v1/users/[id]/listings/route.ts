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
    const { searchParams } = new URL(request.url)
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') || 'active'

    // Get current user to check if accessing own listings
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const isOwnProfile = user && user.id === userId

    // Build query
    let query = supabase
      .from('listings')
      .select('*')
      .eq('owner_id', userId)

    // If not own profile, only show active listings
    if (!isOwnProfile) {
      query = query.eq('status', 'active')
    } else {
      // For own profile, can filter by status
      if (status !== 'all') {
        query = query.eq('status', status)
      }
    }

    const { data: listings, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    return NextResponse.json(listings || [], {
      headers: {
        'Cache-Control': isOwnProfile 
          ? 'private, s-maxage=60, stale-while-revalidate=120'
          : 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}