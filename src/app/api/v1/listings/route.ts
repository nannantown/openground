import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Parse query parameters according to spec
    const q = searchParams.get('q') || undefined
    const cat = searchParams.get('cat') || undefined
    const minPrice = searchParams.get('min') ? parseFloat(searchParams.get('min')!) : undefined
    const maxPrice = searchParams.get('max') ? parseFloat(searchParams.get('max')!) : undefined
    const centerLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
    const centerLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined
    const radiusKm = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined

    console.log('Search params:', { q, cat, minPrice, maxPrice, centerLat, centerLng, radiusKm })

    // Use the PostGIS search function from spec
    const { data: listings, error } = await supabase
      .rpc('rpc_search_listings', {
        q,
        cat,
        min_price: minPrice,
        max_price: maxPrice,
        center_lat: centerLat,
        center_lng: centerLng,
        radius_km: radiusKm || 50
      })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    return NextResponse.json(listings || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
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
    const { title, description, price, category, lat, lng, images = [] } = body

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    // Insert new listing
    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        owner_id: user.id,
        title,
        description,
        price: price ? parseFloat(price) : null,
        category,
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        images
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 })
    }

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}