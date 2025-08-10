'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export function useTypingIndicator(threadId: string) {
  const [isTyping, setIsTyping] = useState(false)
  const [othersTyping, setOthersTyping] = useState<string[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const sendTypingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sendTypingStatus = async (typing: boolean) => {
    try {
      await fetch(`/api/v1/threads/${threadId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_typing: typing }),
      })
    } catch (error) {
      console.error('Failed to send typing status:', error)
    }
  }

  const startTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true)
      sendTypingStatus(true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      sendTypingStatus(false)
    }, 3000) // Stop typing after 3 seconds of inactivity

    // Throttle typing status updates
    if (sendTypingTimeoutRef.current) {
      clearTimeout(sendTypingTimeoutRef.current)
    }
    
    sendTypingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        sendTypingStatus(true)
      }
    }, 1000) // Send typing status every second while typing
  }, [isTyping, threadId])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    
    if (sendTypingTimeoutRef.current) {
      clearTimeout(sendTypingTimeoutRef.current)
      sendTypingTimeoutRef.current = null
    }
    
    if (isTyping) {
      setIsTyping(false)
      sendTypingStatus(false)
    }
  }, [isTyping, threadId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (sendTypingTimeoutRef.current) {
        clearTimeout(sendTypingTimeoutRef.current)
      }
    }
  }, [])

  return {
    isTyping,
    othersTyping,
    startTyping,
    stopTyping,
  }
}