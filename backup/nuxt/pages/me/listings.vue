<template>
  <div class="listings-page">
    <div class="container">
      <!-- Header Section -->
      <header class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>My Listings</h1>
            <p>Manage your active listings and track their performance</p>
          </div>
          <div class="header-actions">
            <NuxtLink to="/new-listing" class="btn btn-primary">
              ✨ Create New Listing
            </NuxtLink>
          </div>
        </div>
      </header>

      <!-- Auth Gate -->
      <div v-if="!user" class="auth-prompt">
        <div class="auth-card">
          <div class="auth-icon">🔒</div>
          <h2>Sign In Required</h2>
          <p>You need to be signed in to view and manage your listings</p>
          <NuxtLink to="/login" class="btn btn-primary">
            🔑 Sign In
          </NuxtLink>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else-if="mine.length === 0" class="empty-state">
        <div class="empty-icon">📦</div>
        <h2>No Listings Yet</h2>
        <p>Start by creating your first listing to showcase your items to potential buyers</p>
        <NuxtLink to="/new-listing" class="btn btn-primary btn-lg">
          ✨ Create Your First Listing
        </NuxtLink>
      </div>

      <div v-else class="listings-content">
        <!-- Stats Bar -->
        <div class="stats-bar">
          <div class="stat-card">
            <div class="stat-value">{{ mine.length }}</div>
            <div class="stat-label">Total Listings</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ activeCount }}</div>
            <div class="stat-label">Active</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ soldCount }}</div>
            <div class="stat-label">Sold</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-tabs">
            <button 
              class="filter-tab" 
              :class="{ active: selectedFilter === 'all' }"
              @click="selectedFilter = 'all'"
            >
              All ({{ mine.length }})
            </button>
            <button 
              class="filter-tab" 
              :class="{ active: selectedFilter === 'active' }"
              @click="selectedFilter = 'active'"
            >
              Active ({{ activeCount }})
            </button>
            <button 
              class="filter-tab" 
              :class="{ active: selectedFilter === 'sold' }"
              @click="selectedFilter = 'sold'"
            >
              Sold ({{ soldCount }})
            </button>
          </div>
        </div>

        <!-- Listings Grid -->
        <div class="listings-grid">
          <article 
            v-for="listing in filteredListings" 
            :key="listing.id" 
            class="listing-item"
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
              <div class="status-badge" :class="`status-${listing.status}`">
                {{ getStatusText(listing.status) }}
              </div>
            </div>

            <!-- Listing Content -->
            <div class="listing-content">
              <div class="listing-header">
                <h3 class="listing-title">{{ listing.title }}</h3>
                <div class="listing-price">{{ formatPrice(listing.price) }}</div>
              </div>
              
              <p class="listing-description" v-if="listing.description">
                {{ listing.description.slice(0, 100) }}{{ listing.description.length > 100 ? '...' : '' }}
              </p>

              <div class="listing-meta">
                <span class="meta-item">
                  📅 {{ formatDate(listing.created_at) }}
                </span>
                <span class="meta-item">
                  ⏰ Expires {{ formatDate(listing.expires_at) }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="listing-actions">
              <div class="primary-actions">
                <NuxtLink :to="`/listing/${listing.id}`" class="btn btn-ghost btn-sm">
                  👁️ View
                </NuxtLink>
                <button @click="edit(listing)" class="btn btn-secondary btn-sm">
                  ✏️ Edit
                </button>
                <div class="dropdown">
                  <button class="btn btn-ghost btn-sm dropdown-toggle" @click="toggleDropdown(listing.id)">
                    ⚙️
                  </button>
                  <div class="dropdown-menu" :class="{ show: openDropdown === listing.id }">
                    <button @click="setStatus(listing.id, 'active')" class="dropdown-item">
                      ✅ Mark Active
                    </button>
                    <button @click="setStatus(listing.id, 'sold')" class="dropdown-item">
                      💰 Mark Sold
                    </button>
                    <button @click="setStatus(listing.id, 'expired')" class="dropdown-item">
                      ⏸️ Mark Expired
                    </button>
                    <div class="dropdown-divider"></div>
                    <button @click="remove(listing.id)" class="dropdown-item danger">
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAsyncData, navigateTo } from '#app'
import { useAuth } from '~~/composables/useAuth'
import type { Listing } from '~~/shared/types'

const { user } = useAuth()
const { data, refresh } = await useAsyncData('my-listings', async () => {
  if (!user.value) return [] as Listing[]
  const res = await $fetch('/api/me/listings')
  return res as Listing[]
})

const mine = computed<Listing[]>(() => data.value || [])
const selectedFilter = ref<'all' | 'active' | 'sold'>('all')
const openDropdown = ref<string | null>(null)

// Computed stats
const activeCount = computed(() => mine.value.filter(l => l.status === 'active').length)
const soldCount = computed(() => mine.value.filter(l => l.status === 'sold').length)

// Filtered listings
const filteredListings = computed(() => {
  if (selectedFilter.value === 'all') return mine.value
  return mine.value.filter(l => l.status === selectedFilter.value)
})

// Helper functions
function firstImage(listing: Listing) {
  return (listing.images as string[])?.[0]
}

function formatPrice(price?: number | null) {
  if (price == null) return 'Contact for price'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(price))
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    active: '🟢 Active',
    sold: '✅ Sold', 
    expired: '⏰ Expired',
    hidden: '👁️ Hidden'
  }
  return statusMap[status] || status
}

function toggleDropdown(listingId: string) {
  openDropdown.value = openDropdown.value === listingId ? null : listingId
}

// Actions
async function setStatus(id: string, status: 'active' | 'sold' | 'expired' | 'hidden') {
  if (!user.value) return navigateTo('/login')
  try {
    await $fetch(`/api/listings/${id}/status`, { method: 'POST', body: { status } })
    await refresh()
    openDropdown.value = null
  } catch (error) {
    alert('Failed to update status')
  }
}

async function edit(listing: Listing) {
  const title = prompt('Edit Title:', listing.title)
  if (title == null) return
  
  const priceStr = prompt('Edit Price (leave empty for no price):', listing.price?.toString() || '')
  const price = priceStr ? Number(priceStr) : null
  
  if (isNaN(price || 0)) {
    alert('Invalid price format')
    return
  }
  
  try {
    await $fetch(`/api/listings/${listing.id}`, { 
      method: 'PUT', 
      body: { title, price } 
    })
    await refresh()
  } catch (error) {
    alert('Failed to update listing')
  }
}

async function remove(id: string) {
  if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) return
  
  try {
    await $fetch(`/api/listings/${id}`, { method: 'DELETE' })
    await refresh()
    openDropdown.value = null
  } catch (error) {
    alert('Failed to delete listing')
  }
}

// Close dropdown when clicking outside
function handleClickOutside() {
  openDropdown.value = null
}
</script>

<style scoped>
/* Page Layout */
.listings-page {
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

/* Stats Bar */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  text-align: center;
  transition: all 0.2s ease;
}

.stat-card:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: var(--space-1);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
}

/* Filters Section */
.filters-section {
  margin-bottom: var(--space-6);
}

.filter-tabs {
  display: flex;
  gap: var(--space-2);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-1);
}

.filter-tab {
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
}

.filter-tab:hover {
  color: var(--text-primary);
  background: var(--surface-hover);
}

.filter-tab.active {
  background: var(--accent);
  color: var(--neutral-950);
  font-weight: 600;
}

/* Listings Grid */
.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--space-6);
}

.listing-item {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.listing-item:hover {
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

.listing-item:hover .listing-image .image {
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

.status-badge {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.status-active {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.status-sold {
  background: rgba(59, 130, 246, 0.9);
  color: white;
}

.status-expired {
  background: rgba(156, 163, 175, 0.9);
  color: white;
}

.status-hidden {
  background: rgba(107, 114, 128, 0.9);
  color: white;
}

/* Listing Content */
.listing-content {
  padding: var(--space-4);
}

.listing-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.listing-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
}

.listing-price {
  font-size: 1rem;
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
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
  margin-bottom: var(--space-4);
}

.meta-item {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* Listing Actions */
.listing-actions {
  padding: 0 var(--space-4) var(--space-4);
  border-top: 1px solid var(--border-subtle);
  padding-top: var(--space-4);
}

.primary-actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

/* Dropdown */
.dropdown {
  position: relative;
}

.dropdown-toggle {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: var(--space-1);
  min-width: 160px;
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px);
  transition: all 0.2s ease;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: left;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.dropdown-item:hover {
  background: var(--surface-hover);
  color: var(--text-primary);
}

.dropdown-item.danger {
  color: var(--error);
}

.dropdown-item.danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error);
}

.dropdown-divider {
  height: 1px;
  background: var(--border);
  margin: var(--space-1) 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-4);
  }
  
  .stats-bar {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .listings-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-tabs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .listings-page {
    padding: var(--space-4) 0;
  }
  
  .stats-bar {
    grid-template-columns: 1fr;
  }
  
  .primary-actions {
    flex-wrap: wrap;
  }
  
  .listing-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }
}
</style>
