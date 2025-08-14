'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Key, MessageCircle, Home, Loader2, Mail, User, ChevronRight, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface Thread {
  id: string
  listing_id: string
  last_message: string
  updated_at: string
  unread_count?: number
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
  const [searchQuery, setSearchQuery] = useState('')

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

  // Filter threads based on search query
  const filteredThreads = threads.filter(thread => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const otherParticipant = thread.participants.find(
      p => p.user.id !== user?.id
    )?.user
    
    return (
      thread.listing?.title?.toLowerCase().includes(query) ||
      thread.last_message?.toLowerCase().includes(query) ||
      otherParticipant?.display_name?.toLowerCase().includes(query)
    )
  })

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
            
            {/* Search Bar */}
            <div className="mt-4 relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="メッセージ、ユーザー名、商品名で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                  data-testid="search-input"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
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

          {!isLoading && filteredThreads.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm divide-y" data-testid="thread-list">
              {filteredThreads.map((thread) => {
                const otherParticipant = thread.participants.find(
                  p => p.user.id !== user.id
                )?.user
                const firstImage = thread.listing?.images?.[0]

                return (
                  <Link
                    key={thread.id}
                    href={`/messages/${thread.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                    data-testid={`thread-${thread.id}`}
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative">
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
                          
                          {/* Unread Badge */}
                          {thread.unread_count && thread.unread_count > 0 && (
                            <div 
                              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1"
                              data-testid="unread-badge"
                            >
                              {thread.unread_count > 99 ? '99+' : thread.unread_count}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header */}
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-gray-900 truncate ${
                              thread.unread_count && thread.unread_count > 0 ? 'font-bold' : ''
                            }`}>
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
                                  alt={thread.listing?.title || 'Listing image'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">
                                {thread.listing?.title || 'Unknown Listing'}
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatPrice(thread.listing?.price)}
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

          {/* Search Results Message */}
          {!isLoading && searchQuery && filteredThreads.length === 0 && threads.length > 0 && (
            <div className="text-center py-16" data-testid="search-results">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">検索結果が見つかりません</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                「{searchQuery}」に一致するメッセージが見つかりませんでした
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery('')}
              >
                検索をクリア
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}