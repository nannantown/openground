// usersテーブルの構造を確認するスクリプト
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

async function checkUsersTable() {
  try {
    console.log('Checking users table structure...')
    
    // まず既存のユーザーデータを確認
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (selectError) {
      console.error('Error selecting from users table:', selectError)
      return
    }

    console.log('Sample user data:', users)

    if (users && users.length > 0) {
      console.log('Users table columns:', Object.keys(users[0]))
    } else {
      console.log('Users table is empty, trying to insert a test record to see column structure...')
    }

  } catch (error) {
    console.error('Check failed:', error)
  }
}

checkUsersTable()