'use client'

import { useSupabase } from '@/app/providers'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthPage() {
  const supabase = useSupabase()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if user is already authenticated
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const redirect = searchParams.get('redirect') || '/'
          setStatus('success')
          
          // Start countdown
          const timer = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timer)
                router.push(redirect)
                return 0
              }
              return prev - 1
            })
          }, 1000)
          
          // Auto redirect after 5 seconds
          setTimeout(() => {
            router.push(redirect)
          }, 5000)
          
          return () => clearInterval(timer)
        } else {
          // If no user, redirect to login
          setTimeout(() => {
            router.push('/login')
          }, 2000)
          setStatus('error')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setStatus('error')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      }
    }

    handleAuthCallback()
  }, [supabase, router, searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'loading' && (
            <div className="text-center">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                認証を確認しています...
              </h2>
              <p className="text-gray-600">
                しばらくお待ちください
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                サインイン完了！
              </h2>
              <p className="text-gray-600 mb-4">
                {countdown}秒後に自動的にリダイレクトします
              </p>
              <button
                onClick={() => router.push('/')}
                className="btn btn-primary"
              >
                すぐにホームに戻る
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                認証に失敗しました
              </h2>
              <p className="text-gray-600 mb-4">
                ログインページにリダイレクトします
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn btn-primary"
              >
                ログインページに戻る
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}