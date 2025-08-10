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

    // Get user's favourite listing IDs
    const { data: favourites, error } = await supabase
      .from('favourites')
      .select('listing_id')
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch favourites' }, { status: 500 })
    }

    const listingIds = favourites?.map(f => f.listing_id) || []
    return NextResponse.json(listingIds)
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
    console.log('User from auth:', { user: user?.id, error: authError })
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get listing_id from request body
    const { listing_id } = await request.json()
    if (!listing_id) {
      return NextResponse.json({ error: 'listing_id is required' }, { status: 400 })
    }

    console.log('Attempting to add favourite:', { user_id: user.id, listing_id })

    // First, try to add the favourite
    // If it fails due to foreign key constraint, we'll handle it

    // Add to favourites
    const { error } = await supabase
      .from('favourites')
      .insert({
        user_id: user.id,
        listing_id: listing_id
      })

    if (error) {
      console.error('Database error adding favourite:', error)
      
      // If it's a foreign key constraint error related to users
      if (error.code === '23503' && error.message.includes('favourites_user_id_fkey')) {
        // Try to create the user in users table first
        console.log('User not found in users table, trying to create...')
        console.log('User data from auth:', { id: user.id, email: user.email })
        
        // Try to create user with minimal required fields
        let userInsertData: any = { 
          id: user.id,
          display_name: user.email?.split('@')[0] || `User_${user.id.slice(0,8)}`
        }
        
        console.log('Trying to insert user with data:', userInsertData)
        
        const { error: userInsertError } = await supabase
          .from('users')
          .insert(userInsertData)

        if (userInsertError) {
          console.error('Failed to create user:', userInsertError)
          
          // If display_name is the issue, try a different approach
          if (userInsertError.code === '23502' && userInsertError.message.includes('display_name')) {
            console.log('Trying to create user with auto-generated display_name')
            const fallbackData = { 
              id: user.id,
              display_name: `User${Date.now()}`
            }
            
            const { error: fallbackError } = await supabase
              .from('users')
              .insert(fallbackData)
            
            if (fallbackError) {
              console.error('Fallback user creation failed:', fallbackError)
              return NextResponse.json({ 
                error: 'Failed to create user after multiple attempts: ' + fallbackError.message 
              }, { status: 500 })
            }
          } else {
            return NextResponse.json({ 
              error: 'User creation failed: ' + userInsertError.message 
            }, { status: 500 })
          }
        }
        
        console.log('User created successfully, now retrying favourite...')

        // Try adding favourite again
        const { error: retryError } = await supabase
          .from('favourites')
          .insert({
            user_id: user.id,
            listing_id: listing_id
          })

        if (retryError) {
          console.error('Retry failed:', retryError)
          return NextResponse.json({ 
            error: 'Failed to add favourite after user creation: ' + retryError.message 
          }, { status: 500 })
        }
      } else {
        return NextResponse.json({ error: 'Failed to add favourite: ' + error.message }, { status: 500 })
      }
    }

    console.log('Successfully added favourite')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}