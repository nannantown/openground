<template>
  <div class="favourites-page">
    <div class="container">
      <!-- Header Section -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>❤️ お気に入り</h1>
            <p>保存したアイテムをここで管理できます</p>
          </div>
          <div v-if="user && favListings.length > 0" class="header-stats">
            <div class="stat-badge">
              {{ favListings.length }} 件のお気に入り
            </div>
          </div>
        </div>
      </header>

      <!-- Auth Gate -->
      <div v-if="!user" class="auth-prompt">
        <div class="auth-card">
          <div class="auth-icon">🔒</div>
          <h2>サインインが必要です</h2>
          <p>お気に入り機能を使用するには、アカウントにサインインしてください</p>
          <NuxtLink to="/login" class="btn btn-primary btn-lg">
            🔑 サインイン
          </NuxtLink>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="favListings.length === 0" class="empty-state">
        <div class="empty-icon">💔</div>
        <h2>まだお気に入りがありません</h2>
        <p>気になる商品を見つけて、ハートボタンを押してお気に入りに追加しましょう</p>
        <NuxtLink to="/" class="btn btn-primary btn-lg">
          🏠 商品を探す
        </NuxtLink>
      </div>

      <!-- Loading State -->
      <div v-else-if="pending" class="loading-state">
        <div class="loading-spinner">⏳</div>
        <p>お気に入りを読み込み中...</p>
      </div>

      <!-- Favourites Grid -->
      <div v-else class="favourites-content">
        <div class="listings-grid">
          <article 
            v-for="listing in favListings" 
            :key="listing.id" 
            class="listing-card"
          >
            <!-- Listing Image -->
            <div class="listing-image">
              <NuxtImg
                v-if="firstImage(listing)"
                :src="firstImage(listing)"
                :alt="listing.title"
                class="image"
              />
              <div v-else class="no-image">
                <span>📷</span>
              </div>
              <button 
                @click="removeFavourite(listing.id)" 
                class="remove-btn"
                title="お気に入りから削除"
              >
                💔
              </button>
            </div>

            <!-- Listing Content -->
            <div class="listing-content">
              <NuxtLink :to="`/listing/${listing.id}`" class="listing-link">
                <h3 class="listing-title">{{ listing.title }}</h3>
                <div class="listing-price">{{ formatPrice(listing.price) }}</div>
                <p v-if="listing.description" class="listing-description">
                  {{ listing.description.slice(0, 80) }}{{ listing.description.length > 80 ? '...' : '' }}
                </p>
                <div class="listing-meta">
                  <span class="meta-item">
                    📅 {{ formatDate(listing.created_at) }}
                  </span>
                </div>
              </NuxtLink>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAsyncData, useHead } from '#app'
import { useAuth } from '~~/composables/useAuth'
import { useFavourites } from '~~/composables/useFavourites'
import { useListings } from '~~/composables/useListings'
import type { Listing } from '~~/shared/types'

const { user } = useAuth()
const { listFavouriteIds, removeFavourite: removeFavouriteAPI } = useFavourites()
const { searchListings } = useListings()

const pending = ref(false)

const { data, refresh } = await useAsyncData('favs', async () => {
  if (!user.value) return [] as Listing[]
  try {
    pending.value = true
    const ids = await listFavouriteIds()
    if (!ids.length) return [] as Listing[]
    // naive fetch: filter client-side
    const all = await searchListings()
    return all.filter((l) => ids.includes(l.id))
  } catch (error) {
    console.error('Error fetching favourites:', error)
    return [] as Listing[]
  } finally {
    pending.value = false
  }
})

const favListings = computed<Listing[]>(() => data.value || [])

// Helper functions
function firstImage(listing: Listing) {
  return (listing.images as string[])?.[0]
}

function formatPrice(price?: number | null) {
  if (price == null) return '価格相談'
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(Number(price))
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ja-JP', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

async function removeFavourite(listingId: string) {
  try {
    await removeFavouriteAPI(listingId)
    await refresh() // Refresh the favourites list
  } catch (error) {
    console.error('Error removing favourite:', error)
    alert('お気に入りの削除に失敗しました。もう一度お試しください。')
  }
}

// Set page title
useHead({
  title: 'お気に入り - OpenGround',
  meta: [
    { name: 'description', content: '保存したお気に入りアイテムを管理' }
  ]
})
</script>

<style scoped>
/* Page Layout */
.favourites-page {
  min-height: 100vh;
  padding: var(--space-8) 0;
}

/* Header Section */
.page-header {
  margin-bottom: var(--space-8);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-6);
}

.title-section h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.title-section p {
  color: var(--text-secondary);
  font-size: 1rem;
}

.header-stats {
  display: flex;
  gap: var(--space-3);
}

.stat-badge {
  background: var(--accent);
  color: var(--neutral-950);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 600;
}

/* Auth Prompt */
.auth-prompt {
  display: flex;
  justify-content: center;
  padding: var(--space-16) 0;
}

.auth-card {
  text-align: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: var(--space-8);
  max-width: 400px;
  box-shadow: var(--shadow-md);
}

.auth-icon {
  font-size: 3rem;
  margin-bottom: var(--space-4);
}

.auth-card h2 {
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.auth-card p {
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: var(--space-16) var(--space-4);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
  opacity: 0.6;
}

.empty-state h2 {
  color: var(--text-primary);
  font-size: 1.5rem;
  margin-bottom: var(--space-2);
}

.empty-state p {
  color: var(--text-secondary);
  margin-bottom: var(--space-6);
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: var(--space-16) var(--space-4);
}

.loading-spinner {
  font-size: 3rem;
  margin-bottom: var(--space-4);
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

.loading-state p {
  color: var(--text-secondary);
}

/* Favourites Grid */
.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-6);
}

.listing-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.listing-card:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

/* Listing Image */
.listing-image {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.listing-image .image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.listing-card:hover .listing-image .image {
  transform: scale(1.05);
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  font-size: 2rem;
  color: var(--text-muted);
}

.remove-btn {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  background: rgba(0, 0, 0, 0.8);
  border: none;
  border-radius: var(--radius-full);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.9);
  transform: scale(1.1);
}

/* Listing Content */
.listing-content {
  padding: var(--space-4);
}

.listing-link {
  text-decoration: none;
  color: inherit;
}

.listing-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--space-2) 0;
  line-height: 1.4;
}

.listing-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: var(--space-3);
}

.listing-description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 var(--space-3) 0;
}

.listing-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.meta-item {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }
  
  .listings-grid {
    grid-template-columns: 1fr;
  }
  
  .favourites-page {
    padding: var(--space-4) 0;
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: var(--space-6);
    margin: 0 var(--space-4);
  }
}
</style>


