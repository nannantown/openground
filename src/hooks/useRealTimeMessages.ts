'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

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

export function useRealTimeMessages(threadId: string, userId?: string) {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!threadId || !userId) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    try {
      // Create Server-Sent Events connection
      const eventSource = new EventSource(`/api/v1/threads/${threadId}/messages/stream`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log('Real-time connection established')
        setIsConnected(true)
        reconnectAttemptsRef.current = 0
      }

      eventSource.onmessage = (event) => {
        try {
          const message: Message = JSON.parse(event.data)
          
          // Add the new message to the cache
          queryClient.setQueryData(['messages', threadId], (oldData: Message[] = []) => {
            // Check if message already exists
            if (oldData.some(msg => msg.id === message.id)) {
              return oldData
            }
            return [...oldData, message]
          })

          // Update thread last message
          queryClient.setQueryData(['threads'], (oldThreads: any[] = []) => {
            return oldThreads.map(thread => 
              thread.id === threadId 
                ? { ...thread, last_message: message.body, updated_at: message.created_at }
                : thread
            )
          })

          // Show browser notification for messages from others
          if (message.sender_id !== userId && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`${message.sender.display_name}からメッセージ`, {
              body: message.body,
              icon: message.sender.avatar_url || '/default-avatar.png',
              tag: `message-${message.id}`,
            })
          }
        } catch (error) {
          console.error('Failed to parse message:', error)
        }
      }

      eventSource.onerror = () => {
        console.log('Real-time connection error')
        setIsConnected(false)
        eventSource.close()
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('Failed to establish real-time connection:', error)
      setIsConnected(false)
    }
  }

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
  }

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      } catch (error) {
        console.error('Failed to request notification permission:', error)
        return false
      }
    }
    return Notification.permission === 'granted'
  }

  useEffect(() => {
    if (threadId && userId) {
      connect()
      requestNotificationPermission()
    }

    return () => {
      disconnect()
    }
  }, [threadId, userId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    isConnected,
    requestNotificationPermission,
    reconnect: connect,
    disconnect,
  }
}