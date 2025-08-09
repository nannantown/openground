import type { Message, Thread } from '~~/shared/types'

export function useChat() {
  const base = '/v1'

  async function createThread(
    listing_id: string,
    partner_id: string,
  ): Promise<{ thread_id: string }> {
    return await $fetch(`/v1/threads`, { method: 'POST', body: { listing_id, partner_id } })
  }

  async function listMessages(thread_id: string, after?: string): Promise<Message[]> {
    const qs = new URLSearchParams()
    if (after) qs.set('after', after)
    return await $fetch(`/v1/threads/${thread_id}/messages?${qs.toString()}`)
  }

  async function sendMessage(
    thread_id: string,
    body?: string,
    image_urls: string[] = [],
  ): Promise<Message> {
    return await $fetch(`/v1/threads/${thread_id}/messages`, {
      method: 'POST',
      body: { body, image_urls },
    })
  }

  return { createThread, listMessages, sendMessage }
}
