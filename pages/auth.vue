<template>
  <div class="auth-callback">
    <div class="container">
      <div class="callback-card">
        <div v-if="pending" class="loading-state">
          <div class="loading-icon">⏳</div>
          <h2>認証処理中</h2>
          <p>サインインを完了していますので、お待ちください...</p>
        </div>
        
        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <h2>認証に失敗しました</h2>
          <p>{{ error.message || '認証中にエラーが発生しました。' }}</p>
          <NuxtLink to="/login" class="btn btn-primary">
            🔙 ログイン画面に戻る
          </NuxtLink>
        </div>
        
        <div v-else class="success-state">
          <div class="success-icon">✅</div>
          <h2>認証成功</h2>
          <p>ようこそ！リダイレクトしています...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from '#app'
import { useSupabaseClient, useSupabaseUser, useHead } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()

const pending = ref(true)
const error = ref<Error | null>(null)

onMounted(async () => {
  try {
    // Handle OAuth callback
    const { data, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      throw authError
    }

    // If already has session, redirect immediately
    if (data.session) {
      const redirect = (route.query.redirect as string) || '/'
      await router.push(redirect)
      return
    }

    // Wait for auth state change (for OAuth redirects)
    const timeoutId = setTimeout(() => {
      throw new Error('認証がタイムアウトしました。もう一度お試しください。')
    }, 30000) // 30 second timeout

    await new Promise((resolve, reject) => {
      const unsubscribe = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          clearTimeout(timeoutId)
          unsubscribe.data.subscription.unsubscribe()
          resolve(session)
        } else if (event === 'SIGNED_OUT') {
          clearTimeout(timeoutId)
          unsubscribe.data.subscription.unsubscribe()
          reject(new Error('認証がキャンセルされました。'))
        }
      })
    })

    // Success - redirect to intended page or home
    const redirect = (route.query.redirect as string) || '/'
    await router.push(redirect)
    
  } catch (e: any) {
    console.error('Auth callback error:', e)
    error.value = e
  } finally {
    pending.value = false
  }
})

// Set page title
useHead({
  title: '認証中...'
})
</script>

<style scoped>
.auth-callback {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.callback-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  text-align: center;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-xl);
}

.loading-state,
.error-state,
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
}

.loading-icon,
.error-icon,
.success-icon {
  font-size: 3rem;
  margin-bottom: var(--space-2);
}

.loading-icon {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.callback-card h2 {
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.callback-card p {
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

@media (max-width: 480px) {
  .callback-card {
    padding: var(--space-6);
    margin: var(--space-4);
  }
}
</style>


