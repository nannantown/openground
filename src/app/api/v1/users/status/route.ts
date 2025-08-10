import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, last_seen } = body

    // Update user's online status
    // For now, we'll store this in a simple way
    // In production, you might want a separate table for user sessions
    const { error } = await supabase
      .from('users')
      .update({
        // Add these columns to your users table or create a separate user_sessions table
        // For now, we'll just update a timestamp
        // last_seen: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      console.error('Status update error:', error)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}