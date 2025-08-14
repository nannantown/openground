'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, createContext, useContext, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createGuestAwareFetch } from '@/lib/api-client'
import type { SupabaseClient } from '@supabase/supabase-js'

const SupabaseContext = createContext<SupabaseClient | undefined>(undefined)

export function useSupabase() {
  const context = useContext(SupabaseContext)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createClient())
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }))

  // ゲストモードのfetchインターセプトを初期化
  useEffect(() => {
    createGuestAwareFetch()
  }, [])

  return (
    <SupabaseContext.Provider value={supabaseClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SupabaseContext.Provider>
  )
}