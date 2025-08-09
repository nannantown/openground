<template>
  <main class="container" style="max-width: 560px; padding: 24px; display: grid; gap: 14px">
    <h1 class="heading">Sign in</h1>
    <p class="subheading">Use email magic link or OAuth to continue</p>

    <form
      class="card"
      style="padding: 16px; display: grid; gap: 10px"
      @submit.prevent="emailSignIn"
    >
      <input v-model="email" class="input" type="email" placeholder="you@example.com" required />
      <button class="btn btn-primary" :disabled="pending">Send magic link</button>
    </form>

    <div class="row" style="gap: 10px">
      <button class="btn" @click="oauth('google')">Continue with Google</button>
      <button class="btn" @click="oauth('github')">Continue with GitHub</button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '#app'
// Use Nuxt Supabase module composable
// eslint-disable-next-line @typescript-eslint/no-var-requires
const supabase = (globalThis as any).useSupabaseClient
  ? (globalThis as any).useSupabaseClient()
  : require('#imports').useSupabaseClient()

const router = useRouter()
const email = ref('')
const pending = ref(false)

async function emailSignIn() {
  pending.value = true
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.value,
      options: { emailRedirectTo: location.origin },
    })
    if (error) throw error
    alert('Check your inbox for the magic link')
    await $fetch('/api/me/ensure-user', { method: 'POST' })
    router.push('/')
  } catch (e: any) {
    alert(e.message || 'Failed')
  } finally {
    pending.value = false
  }
}

async function oauth(provider: 'google' | 'github') {
  await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: location.origin } })
  await $fetch('/api/me/ensure-user', { method: 'POST' })
}
</script>
