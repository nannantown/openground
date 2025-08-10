<template>
  <div class="min-h-screen">
    <!-- Hero Section -->
    <section class="py-16 text-center">
      <div class="container">
        <h1 class="text-4xl font-bold mb-4">
          Find Amazing Deals <span class="text-accent">Locally</span>
        </h1>
        <p class="text-lg text-secondary mb-8 max-w-2xl mx-auto">
          Buy and sell with confidence in your community. Discover unique items, connect with local sellers, and find great bargains.
        </p>
      </div>
    </section>

    <!-- Search Section -->
    <section class="pb-12">
      <div class="container">
        <div class="card-elevated p-8 max-w-4xl mx-auto">
          <form @submit.prevent="onSearch" class="search-form">
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label">What are you looking for?</label>
                <input 
                  v-model="q" 
                  type="search" 
                  class="form-input" 
                  placeholder="Search for anything..."
                />
              </div>
              <div class="form-group">
                <label class="form-label">Category</label>
                <select v-model="cat" class="form-select">
                  <option value="">All Categories</option>
                  <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Min Price</label>
                <input 
                  v-model.number="min" 
                  type="number" 
                  class="form-input" 
                  placeholder="$0"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Max Price</label>
                <input 
                  v-model.number="max" 
                  type="number" 
                  class="form-input" 
                  placeholder="Any"
                />
              </div>
              <div class="form-group">
                <label class="form-label">Distance</label>
                <input 
                  v-model.number="radiusKm" 
                  type="number" 
                  class="form-input" 
                  placeholder="25 km" 
                  min="1"
                />
              </div>
              <div class="form-group flex items-end">
                <button 
                  type="button" 
                  @click="useCurrentLocation"
                  class="btn btn-secondary w-full"
                >
                  📍 Use Location
                </button>
              </div>
            </div>

            <div class="text-center mt-6">
              <button type="submit" class="btn btn-primary btn-lg px-12">
                🔍 Search Listings
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- Results Section -->
    <section class="pb-16">
      <div class="container">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-2xl font-semibold">
            {{ listings.length > 0 ? `Found ${listings.length} listings` : 'Latest Listings' }}
          </h2>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm">Grid</button>
            <button class="btn btn-ghost btn-sm">List</button>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-6" v-if="listings.length > 0">
          <article 
            v-for="l in listings" 
            :key="l.id" 
            class="listing-card"
          >
            <div class="listing-image relative">
              <NuxtLink :to="`/listing/${l.id}`" class="block">
                <NuxtImg
                  v-if="firstImage(l)"
                  :src="firstImage(l)"
                  :alt="l.title"
                  class="w-full h-48 object-cover"
                />
                <div v-else class="w-full h-48 bg-neutral-800 flex items-center justify-center">
                  <span class="text-muted text-sm">No Image</span>
                </div>
              </NuxtLink>
              <div class="absolute top-2 right-2">
                <FavouriteButton 
                  :listing-id="l.id" 
                  :favourite-ids="favouriteIds" 
                  @toggle="handleFavouriteToggle"
                />
              </div>
            </div>
            
            <div class="p-4">
              <NuxtLink :to="`/listing/${l.id}`" class="block">
                <h3 class="font-semibold mb-2 line-clamp-2">{{ l.title }}</h3>
                <p class="text-lg font-bold text-accent mb-2">{{ formatPrice(l.price) }}</p>
                <p class="text-sm text-muted mb-3" v-if="l.description">
                  {{ l.description.slice(0, 80) }}{{ l.description.length > 80 ? '...' : '' }}
                </p>
                
                <div class="flex justify-between items-center">
                  <span class="text-xs text-muted">
                    {{ new Date(l.created_at).toLocaleDateString() }}
                  </span>
                </div>
              </NuxtLink>
            </div>
          </article>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-16">
          <div class="text-6xl mb-4">🔍</div>
          <h3 class="text-xl font-semibold mb-2">No listings found</h3>
          <p class="text-muted mb-6">Try adjusting your search criteria or browse all categories</p>
          <NuxtLink to="/new-listing" class="btn btn-primary">
            ✨ Post Your First Listing
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import { useHead, useRoute, useAsyncData, useRequestURL, navigateTo } from '#app'
import { useAuth } from '~~/composables/useAuth'
import { useFavourites } from '~~/composables/useFavourites'
import type { Listing } from '~~/shared/types'
import { useListings } from '~~/composables/useListings'
import FavouriteButton from '~~/components/FavouriteButton.vue'

const route = useRoute()
const { searchListings } = useListings()

const q = ref<string>((route.query.q as string) || '')
const cat = ref<string>((route.query.cat as string) || '')
const min = ref<number | undefined>(route.query.min ? Number(route.query.min) : undefined)
const max = ref<number | undefined>(route.query.max ? Number(route.query.max) : undefined)
const centerLat = ref<number | undefined>(route.query.lat ? Number(route.query.lat) : undefined)
const centerLng = ref<number | undefined>(route.query.lng ? Number(route.query.lng) : undefined)
const radiusKm = ref<number | undefined>(route.query.r ? Number(route.query.r) : undefined)

const { data } = await useAsyncData(
  'feed',
  () =>
    searchListings({
      q: q.value || undefined,
      cat: cat.value || undefined,
      min_price: min.value,
      max_price: max.value,
      center_lat: centerLat.value,
      center_lng: centerLng.value,
      radius_km: radiusKm.value,
    }),
  { server: true },
)

const listings = computed<Listing[]>(() => data.value || [])
const { user } = useAuth()
const { listFavouriteIds, toggleFavourite } = useFavourites()
const favouriteIds = ref<string[]>([])

// Load favourites reactively when user changes
const { data: favsData, refresh: refreshFavs } = await useAsyncData('user-favourites', async () => {
  if (!user.value) return []
  try {
    return await listFavouriteIds()
  } catch (error) {
    console.error('Error loading favourites:', error)
    return []
  }
}, {
  watch: [user],
  server: false
})

watchEffect(() => {
  favouriteIds.value = favsData.value || []
})

async function handleFavouriteToggle(listingId: string) {
  // Refresh the favourites list after toggle
  await refreshFavs()
}

function onSearch() {
  navigateTo({
    query: {
      q: q.value || undefined,
      cat: cat.value || undefined,
      min: min.value,
      max: max.value,
      lat: centerLat.value,
      lng: centerLng.value,
      r: radiusKm.value,
    },
  })
}

function firstImage(l: Listing) {
  return (l.images as string[])[0]
}

function formatPrice(p?: number | null) {
  if (p == null) return 'Contact for price'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(p))
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays} days ago`
  if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`
  return date.toLocaleDateString()
}

const requestURL = useRequestURL()

useHead({
  title: 'Buy & sell locally',
  meta: [
    { name: 'description', content: 'Open Ground classifieds marketplace' },
    { property: 'og:title', content: 'Open Ground' },
    { property: 'og:type', content: 'website' },
    { property: 'og:description', content: 'Find great local deals on Open Ground' },
    { property: 'og:url', content: requestURL.href },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: (data.value || []).map((l, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${requestURL.origin}/listing/${l.id}`,
          name: l.title,
        })),
      }),
    },
  ],
})

const categories = ['Electronics', 'Home', 'Vehicles', 'Jobs']

function useCurrentLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition((pos) => {
    centerLat.value = pos.coords.latitude
    centerLng.value = pos.coords.longitude
  })
}
</script>

<style scoped>
/* Search Form Styles */
.search-form .form-row {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  align-items: end;
}

.search-form .form-row:last-child {
  margin-bottom: 0;
}

.search-form .form-group {
  flex: 1;
}

.search-form .form-group.flex-1 {
  flex: 2;
}

@media (max-width: 768px) {
  .search-form .form-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-form .form-group {
    flex: none;
  }
}

/* Listing Card Styles */
.listing-card {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
}

.listing-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.listing-card .listing-image {
  position: relative;
  overflow: hidden;
}

.listing-card .listing-image img {
  transition: transform 0.3s ease;
}

.listing-card:hover .listing-image img {
  transform: scale(1.05);
}

.favorite-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s ease;
  padding: var(--space-1);
}

.favorite-btn:hover {
  transform: scale(1.1);
}

/* Component specific styles */
.bg-neutral-800 {
  background-color: var(--neutral-800);
}
</style>
