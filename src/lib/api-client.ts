/**
 * ゲストモードを考慮したAPIクライアント
 * 開発環境でゲストユーザーの場合、適切なヘッダーを付与してリクエストを送信
 */

const isGuestMode = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    return localStorage.getItem('dev-guest-mode') === 'true'
  }
  return false
}

export const apiClient = {
  async fetch(url: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers)
    
    // ゲストモードの場合はヘッダーを追加
    if (isGuestMode()) {
      headers.set('x-guest-user', '00000000-0000-0000-0000-000000000001')
    }
    
    return fetch(url, {
      ...options,
      headers,
    })
  }
}

// デフォルトのfetchを置き換える関数
export const createGuestAwareFetch = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const originalFetch = window.fetch
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input === 'string' && (input.startsWith('/api/') || input.startsWith('/api/v1/'))) {
        const headers = new Headers(init?.headers)
        
        // ゲストモードの場合はヘッダーを追加
        if (isGuestMode()) {
          headers.set('x-guest-user', '00000000-0000-0000-0000-000000000001')
        }
        
        return originalFetch(input, {
          ...init,
          headers,
        })
      }
      return originalFetch(input, init)
    }
  }
}