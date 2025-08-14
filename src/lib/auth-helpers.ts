import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email?: string
  display_name?: string
  avatar_url?: string | null
  isGuest?: boolean
}

/**
 * 開発環境でゲストユーザーを処理するAuth helper
 * 本番環境では通常のSupabase認証のみを使用
 */
export async function getAuthUser(request?: NextRequest): Promise<{ user: AuthUser | null, error: string | null }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error && error.message !== 'Auth session missing!') {
      return { user: null, error: error.message }
    }

    if (user) {
      return {
        user: {
          id: user.id,
          email: user.email,
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url,
          isGuest: false
        },
        error: null
      }
    }

    // 開発環境でのみゲストアクセスを許可（フォールバック用）
    if (process.env.NODE_ENV === 'development' && request) {
      const guestHeader = request.headers.get('x-guest-user')
      if (guestHeader === '00000000-0000-0000-0000-000000000001') {
        return {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'guest@dev.local',
            display_name: '開発用ゲスト',
            avatar_url: null,
            isGuest: true
          },
          error: null
        }
      }
    }

    return { user: null, error: 'Unauthorized' }
  } catch (error: any) {
    return { user: null, error: error.message || 'Authentication failed' }
  }
}