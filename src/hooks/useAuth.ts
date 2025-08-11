'use client'

import { useSupabase } from '@/app/[locale]/providers'
import { useQuery } from '@tanstack/react-query'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const supabase = useSupabase()

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
    staleTime: Infinity,
  })

  const signOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return {
    user,
    isLoading,
    signOut,
    isAuthenticated: !!user,
  }
}