<template>
  <main class="container">
    <h1>Open Ground</h1>
    <form @submit.prevent="onSearch">
      <input v-model="q" type="search" placeholder="Search listings" />
      <select v-model="cat">
        <option value="">All</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <input v-model.number="min" type="number" placeholder="Min" />
      <input v-model.number="max" type="number" placeholder="Max" />
      <button>Search</button>
    </form>

    <ul class="grid">
      <li v-for="l in listings" :key="l.id">
        <NuxtLink :to="`/listing/${l.id}`">
          <NuxtImg
            v-if="firstImage(l)"
            :src="firstImage(l)"
            width="320"
            height="240"
            :alt="l.title"
          />
          <h2>{{ l.title }}</h2>
          <p>{{ formatPrice(l.price) }}</p>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHead, useRoute, useAsyncData, useRequestURL, navigateTo } from '#app'
import type { Listing } from '~~/shared/types'
import { useListings } from '~~/composables/useListings'

const route = useRoute()
const { searchListings } = useListings()

const q = ref<string>((route.query.q as string) || '')
const cat = ref<string>((route.query.cat as string) || '')
const min = ref<number | undefined>(route.query.min ? Number(route.query.min) : undefined)
const max = ref<number | undefined>(route.query.max ? Number(route.query.max) : undefined)

const { data } = await useAsyncData(
  'feed',
  () =>
    searchListings({
      q: q.value || undefined,
      cat: cat.value || undefined,
      min_price: min.value,
      max_price: max.value,
    }),
  { server: true },
)

const listings = computed<Listing[]>(() => data.value || [])

function onSearch() {
  navigateTo({
    query: { q: q.value || undefined, cat: cat.value || undefined, min: min.value, max: max.value },
  })
}

function firstImage(l: Listing) {
  return (l.images as string[])[0]
}

function formatPrice(p?: number | null) {
  if (p == null) return ''
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(p))
}

useHead(() => ({
  title: 'Buy & sell locally',
  meta: [
    { name: 'description', content: 'Open Ground classifieds marketplace' },
    { property: 'og:title', content: 'Open Ground' },
    { property: 'og:type', content: 'website' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify(() => {
        const origin = useRequestURL().origin
        return {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          itemListElement: (data.value || []).map((l, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${origin}/listing/${l.id}`,
            name: l.title,
          })),
        }
      }),
    },
  ],
}))

const categories = ['Electronics', 'Home', 'Vehicles', 'Jobs']
</script>

<style scoped>
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
}
.grid {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
li {
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 8px;
}
form {
  display: grid;
  grid-auto-flow: column;
  gap: 8px;
  align-items: center;
  margin: 12px 0 24px;
}
</style>
