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
    const { target_type, target_id, reason } = body

    // Validate required fields
    if (!target_type || !target_id || !reason) {
      return NextResponse.json({ 
        error: 'target_type, target_id, and reason are required' 
      }, { status: 400 })
    }

    // Validate target_type
    const validTargetTypes = ['user', 'listing', 'message']
    if (!validTargetTypes.includes(target_type)) {
      return NextResponse.json({ 
        error: 'target_type must be one of: user, listing, message' 
      }, { status: 400 })
    }

    // Verify target exists based on type
    let targetExists = false
    switch (target_type) {
      case 'user':
        const { data: userCheck, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('id', target_id)
          .single()
        targetExists = !userError && !!userCheck
        break
      
      case 'listing':
        const { data: listingCheck, error: listingError } = await supabase
          .from('listings')
          .select('id')
          .eq('id', target_id)
          .single()
        targetExists = !listingError && !!listingCheck
        break
      
      case 'message':
        const { data: messageCheck, error: messageError } = await supabase
          .from('messages')
          .select('id')
          .eq('id', target_id)
          .single()
        targetExists = !messageError && !!messageCheck
        break
    }

    if (!targetExists) {
      return NextResponse.json({ error: `${target_type} not found` }, { status: 404 })
    }

    // Check for duplicate reports (same user, same target)
    const { data: existingReport, error: duplicateError } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', target_type)
      .eq('target_id', target_id)
      .single()

    if (duplicateError && duplicateError.code !== 'PGRST116') {
      console.error('Duplicate check error:', duplicateError)
    }

    if (existingReport) {
      return NextResponse.json({ 
        error: 'You have already reported this item' 
      }, { status: 400 })
    }

    // Create report
    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type,
        target_id,
        reason
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Report submitted successfully',
      report_id: report.id 
    }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}