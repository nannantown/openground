'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Key, MessageCircle, Home, Loader2, Mail, User, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Thread {
  id: string
  listing_id: string
  last_message: string
  updated_at: string
  listing: {
    id: string
    title: string
    price: number | null
    images: string[]
    owner_id: string
  }
  participants: Array<{
    user: {
      id: string
      display_name: string
      avatar_url: string | null
    }
  }>
}

export default function MessagesPage() {
  const { user, isLoading: authLoading } = useAuth()

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['threads'],
    queryFn: async (): Promise<Thread[]> => {
      const response = await fetch('/api/v1/threads')
      if (!response.ok) {
        if (response.status === 401) return []
        throw new Error('Failed to fetch threads')
      }
      return response.json()
    },
    enabled: !!user,
  })

  const formatPrice = (price?: number | null) => {
    if (price == null) return '価格相談'
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(Number(price))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return '今'
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}時間前`
    } else if (diffInHours < 48) {
      return '昨日'
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p>読み込み中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-4">サインインが必要です</h2>
            <p className="text-gray-600 mb-6">
              メッセージ機能を使用するには、アカウントにサインインしてください
            </p>
            <Button asChild size="lg" variant="primary">
              <Link href="/login">
                <Key className="w-4 h-4 mr-2" />
                サインイン
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="py-8">
        <div className="container max-w-4xl">
          <header className="mb-8">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <MessageCircle className="w-6 h-6" />
              メッセージ
            </h1>
            <p className="text-gray-600">出品者とのやり取りを確認できます</p>
          </header>

          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
              <p>メッセージを読み込み中...</p>
            </div>
          )}

          {!isLoading && threads.length === 0 && (
            <div className="text-center py-16">
              <Mail className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">まだメッセージがありません</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                商品ページで「出品者にメッセージ」ボタンを押すと、出品者とのやり取りが始まります
              </p>
              <Button asChild size="lg" variant="primary">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  商品を探す
                </Link>
              </Button>
            </div>
          )}

          {!isLoading && threads.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm divide-y">
              {threads.map((thread) => {
                const otherParticipant = thread.participants.find(
                  p => p.user.id !== user.id
                )?.user
                const firstImage = thread.listing.images?.[0]

                return (
                  <Link
                    key={thread.id}
                    href={`/messages/${thread.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        {otherParticipant?.avatar_url ? (
                          <div className="relative h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={otherParticipant.avatar_url}
                              alt={otherParticipant.display_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {otherParticipant?.display_name || 'Unknown User'}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {formatDate(thread.updated_at)}
                            </span>
                          </div>

                          {/* Listing info */}
                          <div className="flex items-center gap-3 mb-2">
                            {firstImage && (
                              <div className="relative h-10 w-10 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={firstImage}
                                  alt={thread.listing.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {thread.listing.title}
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatPrice(thread.listing.price)}
                              </div>
                            </div>
                          </div>

                          {/* Last message */}
                          <p className="text-sm text-gray-600 truncate">
                            {thread.last_message || 'メッセージを開始しました'}
                          </p>
                        </div>

                        <div className="flex-shrink-0">
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}