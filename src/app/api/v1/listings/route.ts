import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get search parameters
    const q = searchParams.get('q')
    const cat = searchParams.get('cat')
    const min = searchParams.get('min')
    const max = searchParams.get('max')
    
    // Build query
    let query = supabase
      .from('listings')
      .select('*')
      .eq('status', 'active')
    
    // Add text search if query provided
    if (q) {
      console.log('Search query:', q)
      
      // Normalize hiragana/katakana for better Japanese search
      const normalizeJapanese = (text: string) => {
        // Convert hiragana to katakana for consistent search
        return text.replace(/[\u3041-\u3096]/g, (match) => {
          return String.fromCharCode(match.charCodeAt(0) + 0x60)
        })
      }
      
      const normalizedQuery = normalizeJapanese(q)
      console.log('Normalized query:', normalizedQuery)
      
      // For better hiragana/katakana matching, we need to search both ways
      // Search original query and also convert katakana to hiragana
      const denormalizeJapanese = (text: string) => {
        // Convert katakana to hiragana
        return text.replace(/[\u30A1-\u30F6]/g, (match) => {
          return String.fromCharCode(match.charCodeAt(0) - 0x60)
        })
      }
      
      const denormalizedQuery = denormalizeJapanese(q)
      console.log('Denormalized query:', denormalizedQuery)
      
      // Create search patterns for all variants
      const searchPatterns = [
        `title.ilike.%${q}%`,
        `description.ilike.%${q}%`
      ]
      
      if (normalizedQuery !== q) {
        searchPatterns.push(`title.ilike.%${normalizedQuery}%`)
        searchPatterns.push(`description.ilike.%${normalizedQuery}%`)
      }
      
      if (denormalizedQuery !== q) {
        searchPatterns.push(`title.ilike.%${denormalizedQuery}%`)
        searchPatterns.push(`description.ilike.%${denormalizedQuery}%`)
      }
      
      query = query.or(searchPatterns.join(','))
    }
    
    // Add category filter
    if (cat) {
      query = query.eq('category', cat)
    }
    
    // Add price filters
    if (min) {
      const minPrice = parseFloat(min)
      if (!isNaN(minPrice)) {
        query = query.gte('price', minPrice)
      }
    }
    
    if (max) {
      const maxPrice = parseFloat(max)
      if (!isNaN(maxPrice)) {
        query = query.lte('price', maxPrice)
      }
    }
    
    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data: listings, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(listings || [])
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