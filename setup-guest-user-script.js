// ゲストユーザーをSupabaseデータベースに登録するスクリプト
const { createClient } = require('@supabase/supabase-js')

// 環境変数から設定を読み込む（手動で読み込み）
const fs = require('fs')
const path = require('path')

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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Required environment variables are missing')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupGuestUser() {
  try {
    console.log('Setting up guest user...')
    
    // 1. usersテーブルにゲストユーザーを追加（固定UUID使用）
    const guestUserId = '00000000-0000-0000-0000-000000000001'
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: guestUserId,
        display_name: '開発用ゲスト',
        avatar_url: null,
        phone: null,
        is_verified: true,
        created_at: new Date().toISOString()
      })
      .select()

    if (error) {
      console.error('Error inserting guest user:', error)
      return
    }

    console.log('Guest user created/updated successfully:', data)

    // 2. 既存のゲストユーザーデータを確認
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', guestUserId)
      .single()

    if (fetchError) {
      console.error('Error fetching guest user:', fetchError)
      return
    }

    console.log('Guest user exists in database:', existingUser)
    console.log('Guest user setup complete!')

  } catch (error) {
    console.error('Setup failed:', error)
  }
}

setupGuestUser()