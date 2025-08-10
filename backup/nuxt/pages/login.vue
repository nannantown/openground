<template>
  <div class="auth-page">
    <div class="auth-container">
      <!-- Header -->
      <div class="auth-header">
        <NuxtLink to="/" class="logo">
          <div class="logo-icon">🏠</div>
          <span class="logo-text">OpenGround</span>
        </NuxtLink>
      </div>

      <!-- Main Auth Card -->
      <div class="auth-card">
        <div class="auth-content">
          <!-- Title Section -->
          <div class="title-section">
            <h1>{{ isSignUp ? 'Create Account' : 'Welcome Back' }}</h1>
            <p>{{ isSignUp ? 'Join our community of local buyers and sellers' : 'Sign in to continue exploring amazing local deals' }}</p>
          </div>

          <!-- Mode Toggle -->
          <div class="mode-toggle">
            <button 
              type="button" 
              class="mode-btn" 
              :class="{ active: !isSignUp }"
              @click="() => { console.log('Sign In clicked'); isSignUp = false; }"
            >
              Sign In
            </button>
            <button 
              type="button" 
              class="mode-btn" 
              :class="{ active: isSignUp }"
              @click="() => { console.log('Sign Up clicked'); isSignUp = true; }"
            >
              Sign Up
            </button>
          </div>

          <!-- Debug Info -->
          <div v-if="true" class="debug-info" style="background: rgba(255,255,255,0.1); padding: 10px; margin: 10px 0; border-radius: 5px; font-size: 12px;">
            <p>Debug: Current mode = {{ isSignUp ? 'SIGNUP' : 'SIGNIN' }}</p>
            <p>Email: {{ email }}</p>
            <p>Pending: {{ pending }}</p>
          </div>

          <!-- Success/Error Messages -->
          <div v-if="successMessage" class="message success-message">
            <div class="message-icon">✅</div>
            <p>{{ successMessage }}</p>
          </div>
          
          <div v-if="errorMessage" class="message error-message">
            <div class="message-icon">⚠️</div>
            <p>{{ errorMessage }}</p>
          </div>

          <!-- Email Form -->
          <form @submit.prevent="handleEmailAuth" class="email-form">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <div class="input-wrapper">
                <span class="input-icon">📧</span>
                <input 
                  v-model="email" 
                  class="form-input input-with-icon" 
                  type="email" 
                  placeholder="Enter your email address"
                  required 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              class="btn btn-primary btn-lg w-full"
              :disabled="pending"
              :class="{ 'loading': pending }"
            >
              <span v-if="!pending">
                {{ isSignUp ? '✨ Create Account' : '🔑 Send Magic Link' }}
              </span>
              <span v-else>📨 {{ isSignUp ? 'Creating Account...' : 'Sending...' }}</span>
            </button>

            <div class="form-help">
              <p>{{ isSignUp ? "We'll send you a confirmation link to get started" : "We'll send you a secure link to sign in instantly" }}</p>
            </div>
          </form>

          <!-- Divider -->
          <div class="auth-divider">
            <span>or continue with</span>
          </div>

          <!-- OAuth Buttons -->
          <div class="oauth-section">
            <button @click="oauth('google')" class="oauth-btn oauth-google">
              <svg class="oauth-icon" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            <button @click="oauth('github')" class="oauth-btn oauth-github">
              <svg class="oauth-icon" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </button>
          </div>

          <!-- Footer Links -->
          <div class="auth-footer">
            <p v-if="!isSignUp">Don't have an account? 
              <button type="button" @click="isSignUp = true" class="link">Sign up</button>
            </p>
            <p v-else>Already have an account? 
              <button type="button" @click="isSignUp = false" class="link">Sign in</button>
            </p>
            <p class="help-text">
              Need help? <a href="mailto:support@openground.com" class="link">Contact Support</a>
            </p>
          </div>
        </div>
      </div>

      <!-- Background Elements -->
      <div class="auth-bg">
        <div class="bg-circle bg-circle-1"></div>
        <div class="bg-circle bg-circle-2"></div>
        <div class="bg-circle bg-circle-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from '#app'
import { useSupabaseClient, useSupabaseUser } from '#imports'

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const router = useRouter()
const route = useRoute()

const email = ref('')
const pending = ref(false)
const isSignUp = ref(route.query.mode === 'signup' || false)
const successMessage = ref('')
const errorMessage = ref('')

// Redirect if already logged in
watch(user, (newUser) => {
  if (newUser) {
    router.push('/')
  }
})

// Update URL when mode changes
watch(isSignUp, (newMode) => {
  console.log('Mode changed to:', newMode ? 'signup' : 'signin')
  router.replace({ query: { mode: newMode ? 'signup' : 'signin' } })
})

async function handleEmailAuth() {
  if (!email.value) return
  
  pending.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    if (isSignUp.value) {
      // Sign up with email using OTP (passwordless)
      const { error } = await supabase.auth.signInWithOtp({
        email: email.value,
        options: { 
          emailRedirectTo: `${location.origin}/auth`,
          shouldCreateUser: true
        }
      })
      
      if (error) {
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          errorMessage.value = 'このメールアドレスは既に登録されています。サインインしてください。'
          isSignUp.value = false
        } else {
          throw error
        }
      } else {
        successMessage.value = 'アカウント作成完了！メールをチェックして認証リンクをクリックしてください。'
        email.value = '' // Clear email after successful signup
      }
    } else {
      // Sign in with magic link
      const { error } = await supabase.auth.signInWithOtp({
        email: email.value,
        options: { emailRedirectTo: `${location.origin}/auth` }
      })
      
      if (error) {
        if (error.message.includes('not found') || error.message.includes('invalid')) {
          errorMessage.value = 'このメールアドレスのアカウントが見つかりません。サインアップしてください。'
          // Don't auto-switch to signup, let user decide
        } else {
          throw error
        }
      } else {
        successMessage.value = 'メールを確認してください！安全なサインインリンクを送信しました。'
        email.value = '' // Clear email after successful signin request
      }
    }
  } catch (e: any) {
    console.error('Auth error:', e)
    errorMessage.value = e.message || 'エラーが発生しました。もう一度お試しください。'
  } finally {
    pending.value = false
  }
}

async function oauth(provider: 'google' | 'github') {
  try {
    console.log('OAuth button clicked:', provider)
    pending.value = true
    errorMessage.value = ''
    successMessage.value = ''
    
    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: { 
        redirectTo: `${location.origin}/auth`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })
    
    if (error) throw error
    
    // Success message will be shown in the auth callback page
    successMessage.value = `${provider === 'google' ? 'Google' : 'GitHub'}での認証を開始しています...`
    
  } catch (e: any) {
    console.error('OAuth error:', e)
    errorMessage.value = `${provider === 'google' ? 'Google' : 'GitHub'}でのサインインに失敗しました。もう一度お試しください。`
  } finally {
    // Don't set pending to false immediately for OAuth as it redirects
    if (errorMessage.value) {
      pending.value = false
    }
  }
}

// Removed generateRandomPassword as we're using OTP for both signup and signin

function clearMessages() {
  errorMessage.value = ''
  successMessage.value = ''
}

// Clear messages when switching modes
watch(isSignUp, clearMessages)
watch(email, clearMessages)
</script>

<style scoped>
/* Auth Page Layout */
.auth-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
}

.auth-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  position: relative;
  z-index: 1;
}

/* Header */
.auth-header {
  position: absolute;
  top: var(--space-8);
  left: var(--space-8);
}

.auth-header .logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
}

.auth-header .logo-icon {
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--accent), var(--primary-700));
  border-radius: var(--radius-lg);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.auth-header .logo-text {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
}

/* Main Auth Card */
.auth-card {
  width: 100%;
  max-width: 420px;
  background: rgba(38, 38, 38, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-xl);
  overflow: hidden;
}

.auth-content {
  padding: var(--space-8);
}

/* Title Section */
.title-section {
  text-align: center;
  margin-bottom: var(--space-8);
}

.title-section h1 {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.title-section p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

/* Mode Toggle */
.mode-toggle {
  display: flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
  margin-bottom: var(--space-6);
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.mode-btn {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.mode-btn:hover {
  color: var(--text-primary) !important;
  background: var(--surface-hover) !important;
  transform: translateY(-1px);
}

.mode-btn.active {
  background: var(--accent);
  color: var(--neutral-950);
  font-weight: 600;
}

/* Messages */
.message {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
  font-size: 0.875rem;
}

.success-message {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: var(--success);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: var(--error);
}

.message-icon {
  font-size: 1rem;
  margin-top: 1px;
}

.message p {
  margin: 0;
  line-height: 1.4;
  color: inherit;
}

/* Email Form */
.email-form {
  margin-bottom: var(--space-6);
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  font-size: 1rem;
  z-index: 1;
}

.input-with-icon {
  padding-left: 2.5rem;
}

.form-help {
  margin-top: var(--space-3);
  text-align: center;
}

.form-help p {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Loading State */
.btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Divider */
.auth-divider {
  position: relative;
  text-align: center;
  margin: var(--space-6) 0;
}

.auth-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: var(--border);
  z-index: 1;
}

.auth-divider span {
  background: rgba(38, 38, 38, 0.8);
  color: var(--text-muted);
  padding: 0 var(--space-4);
  font-size: 0.875rem;
  position: relative;
  z-index: 2;
}

/* OAuth Section */
.oauth-section {
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 10;
  pointer-events: auto;
}

.oauth-btn:hover {
  background: var(--surface-hover) !important;
  border-color: var(--border) !important;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.oauth-icon {
  width: 20px;
  height: 20px;
}

.oauth-google {
  border-color: rgba(66, 133, 244, 0.3);
}

.oauth-google:hover {
  border-color: rgba(66, 133, 244, 0.5);
  background: rgba(66, 133, 244, 0.1);
}

.oauth-github:hover {
  border-color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
}

/* Footer */
.auth-footer {
  text-align: center;
}

.auth-footer p {
  margin-bottom: var(--space-2);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.auth-footer .help-text {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
  z-index: 10;
  pointer-events: auto;
  cursor: pointer;
}

.link:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

/* Background Elements */
.auth-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(14, 116, 144, 0.05));
  filter: blur(40px);
  animation: float 8s ease-in-out infinite;
}

.bg-circle-1 {
  width: 300px;
  height: 300px;
  top: -150px;
  right: -150px;
  animation-delay: -2s;
}

.bg-circle-2 {
  width: 200px;
  height: 200px;
  bottom: -100px;
  left: -100px;
  animation-delay: -4s;
}

.bg-circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -6s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
    opacity: 0.3;
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
    opacity: 0.1;
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .auth-container {
    padding: var(--space-4);
  }
  
  .auth-header {
    position: relative;
    top: auto;
    left: auto;
    margin-bottom: var(--space-8);
  }
  
  .auth-content {
    padding: var(--space-6);
  }
  
  .title-section h1 {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .auth-content {
    padding: var(--space-4);
  }
}
</style>
