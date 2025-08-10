import { useSupabaseClient, useSupabaseUser } from '#imports'

export function useAuth() {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  async function signInWithEmail(email: string) {
    const { error } = await client.auth.signInWithOtp({ email })
    if (error) throw error
  }

  async function signInWithProvider(provider: 'google' | 'apple') {
    const { error } = await client.auth.signInWithOAuth({ provider })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await client.auth.signOut()
    if (error) throw error
  }

  return { user, signInWithEmail, signInWithProvider, signOut }
}

