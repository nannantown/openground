import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Getting full favourites for user:', user.id)

    // Get user's favourite listing IDs
    const { data: favourites, error: favError } = await supabase
      .from('favourites')
      .select('listing_id')
      .eq('user_id', user.id)

    if (favError) {
      console.error('Error fetching favourites:', favError)
      return NextResponse.json({ error: 'Failed to fetch favourites' }, { status: 500 })
    }

    console.log('Found favourite IDs:', favourites?.map(f => f.listing_id))

    if (!favourites || favourites.length === 0) {
      return NextResponse.json([])
    }

    // Get full listing data
    const listingIds = favourites.map(f => f.listing_id)
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .in('id', listingIds)
      .order('created_at', { ascending: false })

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    console.log('Found listings:', listings?.length)

    return NextResponse.json(listings || [])
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}