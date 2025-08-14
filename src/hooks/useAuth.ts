'use client'

import { useSupabase } from '@/app/[locale]/providers'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'

// ゲストユーザーのモック（固定UUID使用）
const GUEST_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'guest@dev.local',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: {
    display_name: '開発用ゲスト',
    avatar_url: null,
  },
  identities: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export function useAuth() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()
  const [isGuestMode, setIsGuestMode] = useState(false)

  // 開発環境でのみローカルストレージからゲストモードの状態を復元
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const guestMode = localStorage.getItem('dev-guest-mode')
      if (guestMode === 'true') {
        setIsGuestMode(true)
      }
    }
  }, [])

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      // ユーザーがいない場合で、ゲストモードが有効な場合はゲストユーザーを返す
      if (!user && process.env.NODE_ENV === 'development' && isGuestMode) {
        return GUEST_USER
      }
      
      return user
    },
    staleTime: Infinity,
  })

  const signInAsGuest = async () => {
    if (process.env.NODE_ENV === 'development') {
      setIsGuestMode(true)
      localStorage.setItem('dev-guest-mode', 'true')
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
    }
  }

  const signOut = async () => {
    if (isGuestMode) {
      setIsGuestMode(false)
      localStorage.removeItem('dev-guest-mode')
      queryClient.invalidateQueries({ queryKey: ['auth-user'] })
    } else {
      await supabase.auth.signOut()
    }
    window.location.href = '/'
  }

  return {
    user,
    isLoading,
    signOut,
    signInAsGuest,
    isAuthenticated: !!user,
    isGuestMode: isGuestMode && process.env.NODE_ENV === 'development',
  }
}