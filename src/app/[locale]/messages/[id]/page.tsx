'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Header } from '@/components/Header'
import Link from 'next/link'
import Image from 'next/image'
import { useRealTimeMessages } from '@/hooks/useRealTimeMessages'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { X, MessageCircle, User, ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  thread_id: string
  sender_id: string
  body: string
  image_urls: string[]
  created_at: string
  read_by: string[]
  sender: {
    id: string
    display_name: string
    avatar_url: string | null
  }
}

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

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const threadId = params?.id as string
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Get thread info
  const { data: threads = [] } = useQuery({
    queryKey: ['threads'],
    queryFn: async (): Promise<Thread[]> => {
      const response = await fetch('/api/v1/threads')
      if (!response.ok) return []
      return response.json()
    },
    enabled: !!user,
  })

  const thread = threads.find(t => t.id === threadId)

  // Get messages for this thread
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: async (): Promise<Message[]> => {
      const response = await fetch(`/api/v1/threads/${threadId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      return response.json()
    },
    enabled: !!threadId && !!user,
  })

  // Set up real-time messaging
  const { isConnected, requestNotificationPermission } = useRealTimeMessages(threadId, user?.id)
  
  // Set up typing indicators
  const { isTyping, othersTyping, startTyping, stopTyping } = useTypingIndicator(threadId)

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await fetch(`/api/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      
      return response.json()
    },
    onSuccess: () => {
      setMessage('')
      refetchMessages()
      // Also refresh threads list to update last message
      queryClient.invalidateQueries({ queryKey: ['threads'] })
    },
    onError: (error) => {
      console.error('Send message error:', error)
      alert('メッセージの送信に失敗しました。もう一度お試しください。')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || sendMessageMutation.isPending) return
    
    setIsLoading(true)
    sendMessageMutation.mutate(message.trim())
    setIsLoading(false)
  }

  const formatPrice = (price?: number | null) => {
    if (price == null) return '価格相談'
    return new Intl.NumberFormat('ja-JP', { 
      style: 'currency', 
      currency: 'JPY' 
    }).format(Number(price))
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Request notification permission when component mounts
  useEffect(() => {
    if (user) {
      requestNotificationPermission()
    }
  }, [user])

  if (!user) {
    router.push('/login')
    return null
  }

  if (!thread) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center bg-white p-8 rounded-lg shadow-md">
            <X className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-4">チャットが見つかりません</h2>
            <p className="text-gray-600 mb-6">
              このチャットは削除されたか、存在しません
            </p>
            <Button data-testid="back-to-messages-button" asChild variant="primary">
              <Link href="/messages">
                <MessageCircle className="w-4 h-4 mr-2" />
                メッセージ一覧に戻る
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const otherParticipant = thread.participants.find(
    p => p.user.id !== user.id
  )?.user
  const firstImage = thread.listing.images?.[0]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Chat Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container">
          <div className="flex items-center gap-4 py-4">
            <Button data-testid="back-button" variant="ghost" asChild >
              <Link href="/messages">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Link>
            </Button>
            
            {/* Other participant info */}
            {otherParticipant?.avatar_url ? (
              <div className="relative h-10 w-10 rounded-full overflow-hidden">
                <Image
                  src={otherParticipant.avatar_url}
                  alt={otherParticipant.display_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="font-semibold">
                {otherParticipant?.display_name || 'Unknown User'}
              </h1>
              <div className="text-sm text-gray-600">
                {thread.listing.title} - {formatPrice(thread.listing.price)}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                {isConnected ? 'リアルタイム接続中' : 'オフライン'}
              </div>
            </div>

            {/* Listing thumbnail */}
            <Link 
              href={`/listing/${thread.listing.id}`}
              className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 hover:bg-gray-100"
            >
              {firstImage && (
                <div className="relative h-8 w-8 rounded overflow-hidden">
                  <Image
                    src={firstImage}
                    alt={thread.listing.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <span className="text-sm font-medium">商品を見る</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="container py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-gray-600">メッセージがありません</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isOwnMessage = msg.sender_id === user.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-sm ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`rounded-lg p-3 ${
                        isOwnMessage
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                      {msg.image_urls && msg.image_urls.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.image_urls.map((url, index) => (
                            <div key={index} className="relative h-32 w-32 rounded overflow-hidden">
                              <Image
                                src={url}
                                alt={`Image ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                      {formatTime(msg.created_at)}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          
          {/* Typing Indicator */}
          {othersTyping.length > 0 && (
            <div className="flex justify-start">
              <div className="max-w-sm">
                <div className="bg-gray-200 text-gray-700 rounded-lg p-3">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm ml-2">入力中...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t">
        <div className="container py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value)
                if (e.target.value) {
                  startTyping()
                } else {
                  stopTyping()
                }
              }}
              onBlur={stopTyping}
              placeholder="メッセージを入力..."
              className="flex-1 rounded-full"
              disabled={isLoading || sendMessageMutation.isPending}
            />
            <Button
              data-testid="send-message-button"
              type="submit"
              disabled={!message.trim() || isLoading || sendMessageMutation.isPending}
              variant="primary"
            >
              {sendMessageMutation.isPending ? (
                '送信中...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  送信
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}