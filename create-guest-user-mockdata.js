// ゲストユーザー用のモックデータを作成して、threadsとparticipantsテーブルで使用可能にする
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 環境変数の読み込み
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n')
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#')) {
      const [key, value] = line.split('=')
      if (key && value) {
        process.env[key.trim()] = value.trim()
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createGuestMockData() {
  try {
    console.log('Creating guest user mock data...')
    
    const guestUserId = '00000000-0000-0000-0000-000000000001'
    
    // まず、ゲストユーザーのテストスレッドを作成してみる（データベース制約を確認）
    console.log('Testing database constraints...')
    
    // 実際の既存ユーザーIDを取得
    const { data: realUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single()
      
    if (userError || !realUser) {
      console.error('No existing users found:', userError)
      return
    }
    
    console.log('Using real user ID for testing:', realUser.id)
    
    // テストスレッド作成
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .insert({
        last_message: 'Guest test message'
      })
      .select()
      .single()
    
    if (threadError) {
      console.error('Error creating thread:', threadError)
      return
    }
    
    console.log('Thread created:', thread.id)
    
    // participantsテーブルに実際のユーザーを追加してみる
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({
        thread_id: thread.id,
        user_id: realUser.id  // 実際のユーザーIDを使用
      })
      .select()
    
    if (participantError) {
      console.error('Error adding participant:', participantError)
      return
    }
    
    console.log('Participant added successfully:', participant)
    
    // テスト用データをクリーンアップ
    await supabase.from('participants').delete().eq('thread_id', thread.id)
    await supabase.from('threads').delete().eq('id', thread.id)
    
    console.log('Test completed successfully. Database allows normal operations.')
    
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

createGuestMockData()