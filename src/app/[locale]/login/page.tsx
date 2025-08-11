'use client'

import { useState } from 'react'
import { useSupabase } from '@/app/[locale]/providers'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Key, Loader2, ArrowLeft, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  
  const supabase = useSupabase()
  const router = useRouter()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('メールアドレスを入力してください')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { 
            emailRedirectTo: `${window.location.origin}/auth`,
            shouldCreateUser: true
          }
        })
        
        if (error) throw error
        setMessage('確認メールを送信しました。メールボックスをご確認ください。')
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { 
            emailRedirectTo: `${window.location.origin}/auth`,
            shouldCreateUser: false
          }
        })
        
        if (error) throw error
        setMessage('サインインリンクを送信しました。メールボックスをご確認ください。')
      }
    } catch (err: any) {
      console.error('Auth error:', err)
      if (err.message?.includes('User not found')) {
        setError('アカウントが見つかりません。サインアップしてください。')
      } else {
        setError('エラーが発生しました: ' + (err.message || 'Unknown error'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      })
      
      if (error) throw error
    } catch (err: any) {
      console.error('OAuth error:', err)
      setError('ソーシャルログインでエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <h2 className="text-3xl font-bold text-primary">OpenGround</h2>
        </Link>
        
        <Card className="mt-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isSignUp ? 'アカウント作成' : 'サインイン'}
            </CardTitle>
            <CardDescription>
              {isSignUp ? 'すでにアカウントをお持ちですか？ ' : 'アカウントをお持ちでない方は '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-medium text-primary hover:underline"
              >
                {isSignUp ? 'サインイン' : 'サインアップ'}
              </button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                data-testid="oauth-google-button"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Googleでサインイン
              </Button>
              
              <Button
                data-testid="oauth-github-button"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loading}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400"
              >
                <Github className="w-5 h-5 mr-3" />
                GitHubでサインイン
              </Button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background text-muted-foreground">または</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  data-testid="email-input"
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@example.com"
                />
              </div>

              {error && (
                <div className="rounded-md bg-destructive/15 p-4">
                  <div className="text-sm text-destructive">{error}</div>
                </div>
              )}

              {message && (
                <div className="rounded-md bg-green-50 p-4 border border-green-200">
                  <div className="text-sm text-green-700">{message}</div>
                </div>
              )}

              <Button
                data-testid="login-button"
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    処理中...
                  </>
                ) : (
                  <>
                    {isSignUp ? (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        サインアップリンクを送信
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        サインインリンクを送信
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" />
                ホームに戻る
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}