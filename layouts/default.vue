<template>
  <div>
    <header class="modern-header">
      <div class="container">
        <div class="header-content">
          <!-- Logo -->
          <NuxtLink to="/" class="logo">
            <div class="logo-icon">🏠</div>
            <div class="logo-text">
              <span class="logo-name">OpenGround</span>
              <span class="logo-tagline">Local Marketplace</span>
            </div>
          </NuxtLink>

          <!-- Desktop Navigation -->
          <nav class="desktop-nav">
            <NuxtLink to="/" class="nav-link">
              <span class="nav-icon">🏠</span>
              <span>Browse</span>
            </NuxtLink>
            <NuxtLink to="/favourites" class="nav-link">
              <span class="nav-icon">❤️</span>
              <span>Saved</span>
            </NuxtLink>
            <NuxtLink to="/new-listing" class="nav-link nav-link-primary">
              <span class="nav-icon">✨</span>
              <span>Sell</span>
            </NuxtLink>
            <!-- Auth-dependent navigation -->
            <NuxtLink v-if="user" to="/me/listings" class="nav-link">
              <span class="nav-icon">👤</span>
              <span>My Account</span>
            </NuxtLink>
            <NuxtLink v-else to="/login" class="nav-link">
              <span class="nav-icon">🔑</span>
              <span>Sign In</span>
            </NuxtLink>
            <!-- Logout button for authenticated users -->
            <button v-if="user" @click="signOut" class="nav-link nav-logout">
              <span class="nav-icon">🚪</span>
              <span>Sign Out</span>
            </button>
          </nav>

          <!-- Mobile Menu Button -->
          <button class="mobile-menu-btn" @click="toggleMobileMenu">
            <span class="hamburger"></span>
          </button>
        </div>

        <!-- Mobile Navigation -->
        <nav class="mobile-nav" :class="{ 'mobile-nav-open': mobileMenuOpen }">
          <NuxtLink to="/" class="mobile-nav-link" @click="closeMobileMenu">
            <span class="nav-icon">🏠</span>
            <span>Browse</span>
          </NuxtLink>
          <NuxtLink to="/favourites" class="mobile-nav-link" @click="closeMobileMenu">
            <span class="nav-icon">❤️</span>
            <span>Saved</span>
          </NuxtLink>
          <NuxtLink to="/new-listing" class="mobile-nav-link mobile-nav-link-primary" @click="closeMobileMenu">
            <span class="nav-icon">✨</span>
            <span>Sell Something</span>
          </NuxtLink>
          <!-- Auth-dependent mobile navigation -->
          <NuxtLink v-if="user" to="/me/listings" class="mobile-nav-link" @click="closeMobileMenu">
            <span class="nav-icon">👤</span>
            <span>My Account</span>
          </NuxtLink>
          <NuxtLink v-else to="/login" class="mobile-nav-link" @click="closeMobileMenu">
            <span class="nav-icon">🔑</span>
            <span>Sign In</span>
          </NuxtLink>
          <button v-if="user" @click="signOut" class="mobile-nav-link mobile-nav-logout">
            <span class="nav-icon">🚪</span>
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <slot />
    </main>

    <!-- Toast Container -->
    <ClientOnly>
      <div id="toasts" class="toast-container" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSupabaseUser, useSupabaseClient } from '#imports'
import { navigateTo } from '#app'

const mobileMenuOpen = ref(false)
const user = useSupabaseUser()
const supabase = useSupabaseClient()

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}

const signOut = async () => {
  try {
    await supabase.auth.signOut()
    closeMobileMenu() // Close mobile menu if open
    await navigateTo('/')
  } catch (error) {
    console.error('Error signing out:', error)
  }
}
</script>

<style scoped>
/* Modern Header Styles */
.modern-header {
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-subtle);
  position: sticky;
  top: 0;
  z-index: 50;
  transition: all 0.3s ease;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) 0;
}

/* Logo Styles */
.logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  text-decoration: none;
  transition: all 0.2s ease;
}

.logo:hover {
  transform: translateY(-1px);
}

.logo-icon {
  font-size: 2rem;
  background: linear-gradient(135deg, var(--accent), var(--primary-700));
  border-radius: var(--radius-lg);
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.logo-tagline {
  font-size: 0.75rem;
  color: var(--text-muted);
  line-height: 1;
  margin-top: 2px;
}

/* Desktop Navigation */
.desktop-nav {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--surface);
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  color: var(--accent);
  background: rgba(6, 182, 212, 0.1);
}

.nav-link-primary {
  background: var(--accent);
  color: var(--neutral-950);
  font-weight: 600;
}

.nav-logout,
.mobile-nav-logout {
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
}

.nav-logout:hover,
.mobile-nav-logout:hover {
  color: var(--error) !important;
  background: rgba(239, 68, 68, 0.1) !important;
}

.nav-link-primary:hover {
  background: var(--accent-hover);
  color: var(--neutral-950);
  box-shadow: var(--shadow-md);
}

.nav-icon {
  font-size: 1rem;
}

/* Mobile Menu Button */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.mobile-menu-btn:hover {
  background: var(--surface);
}

.hamburger {
  width: 20px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 1px;
  transition: all 0.3s ease;
  position: relative;
}

.hamburger::before,
.hamburger::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--text-primary);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.hamburger::before {
  top: -6px;
}

.hamburger::after {
  top: 6px;
}

/* Mobile Navigation */
.mobile-nav {
  display: none;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--border-subtle);
  max-height: 0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.mobile-nav-open {
  max-height: 300px;
}

.mobile-nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--text-secondary);
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.mobile-nav-link:hover {
  color: var(--text-primary);
  background: var(--surface);
}

.mobile-nav-link.router-link-active {
  color: var(--accent);
  background: rgba(6, 182, 212, 0.1);
}

.mobile-nav-link-primary {
  background: var(--accent);
  color: var(--neutral-950);
  font-weight: 600;
}

.mobile-nav-link-primary:hover {
  background: var(--accent-hover);
  color: var(--neutral-950);
}

/* Main Content */
.main-content {
  min-height: calc(100vh - 80px);
}

/* Toast Container */
.toast-container {
  position: fixed;
  top: 100px;
  right: var(--space-6);
  z-index: 100;
}

/* Responsive Design */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
  }

  .mobile-nav {
    display: flex;
  }

  .logo-text {
    display: none;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }

  .toast-container {
    right: var(--space-4);
    left: var(--space-4);
  }
}

@media (max-width: 480px) {
  .header-content {
    padding: var(--space-3) 0;
  }
}
</style>


