<template>
  <main class="container" v-if="listing">
    <div class="grid" style="grid-template-columns: 2fr 1fr; gap: 20px">
      <section class="card shadow" style="overflow: hidden">
        <img
          v-for="(img, i) in (listing.images as string[] || [])"
          :key="i"
          :src="img"
          :alt="listing.title"
          style="width:100%; display:block; aspect-ratio: 4/3; object-fit: cover"
        />
        <div style="padding:16px">
          <h1 class="heading">{{ listing.title }}</h1>
          <div class="subheading" style="margin-top:6px">{{ listing.category || 'Others' }}</div>
          <p style="margin-top:12px">{{ listing.description }}</p>
        </div>
      </section>
      <aside class="card" style="padding:16px; display:grid; gap:12px">
        <div class="row-between">
          <div class="heading">¥{{ toPrice(listing.price) }}</div>
          <button class="btn btn-primary" @click="contact()">Contact seller</button>
        </div>
        <div class="subheading">Posted {{ fromNow(listing.created_at) }}</div>
        <div class="row" style="gap:8px">
          <button class="btn" type="button" @click="toggleFav()">
            <span v-if="isFaved">★ Saved</span>
            <span v-else>☆ Save</span>
          </button>
          <button v-if="user?.id===listing.owner_id" class="btn" type="button" @click="markSold(true)">Mark sold</button>
          <button v-if="user?.id===listing.owner_id" class="btn" type="button" @click="markSold(false)">Mark active</button>
        </div>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useAsyncData, useHead } from '#app'
import type { Listing } from '~~/shared/types'
import { useListings } from '~~/composables/useListings'
import { useAuth } from '~~/composables/useAuth'
import { useFavourites } from '~~/composables/useFavourites'
import { useChat } from '~~/composables/useChat'

const route = useRoute()
const { getListing } = useListings()
const { createThread } = useChat()
const { user } = useAuth()
const { listFavouriteIds, toggleFavourite } = useFavourites()

const { data } = await useAsyncData(
  `listing:${route.params.id}`,
  () => getListing(String(route.params.id)),
  { server: true },
)
const listing = computed<Listing | null>(() => data.value || null)

function toPrice(v?: number | string | null){
  if (v===null || v===undefined) return '-'
  const n = typeof v==='string'? Number(v): v
  return n.toLocaleString('ja-JP')
}

function fromNow(iso?: string | null){
  if(!iso) return ''
  const d = new Date(iso)
  const diff = (Date.now()-d.getTime())/1000
  if (diff<60) return 'just now'
  if (diff<3600) return `${Math.floor(diff/60)}m ago`
  if (diff<86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

async function contact(){
  if (!listing.value) return
  if (!user.value) return navigateTo('/login')
  const partnerId = (listing.value as any).owner_id as string
  const { thread_id } = await createThread(String(listing.value.id), partnerId)
  await navigateTo(`/chat/${thread_id}`)
}

const favSet = ref<Set<string>>(new Set())
const isFaved = computed(() => favSet.value.has(String(listing.value?.id)))
if (user.value) {
  const ids = await listFavouriteIds()
  favSet.value = new Set(ids)
}
async function toggleFav(){
  if (!listing.value) return
  if (!user.value) return navigateTo('/login')
  favSet.value = await toggleFavourite(String(listing.value.id), favSet.value)
}

async function markSold(sold: boolean){
  if (!listing.value) return
  if (!user.value) return navigateTo('/login')
  await $fetch(`/api/listings/${listing.value.id}/status`, { method: 'POST', body: { status: sold ? 'sold' : 'active' } })
  location.reload()
}

useHead(() => {
  if (!listing.value) return {}
  const l = listing.value
  return {
    title: l.title,
    meta: [
      { name: 'description', content: l.description || '' },
      { property: 'og:title', content: l.title },
      { property: 'og:description', content: l.description || '' },
      { property: 'og:type', content: 'product' },
      l.images?.[0] ? { property: 'og:image', content: l.images[0] as string } : undefined,
    ].filter(Boolean) as any,
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: l.title,
            description: l.description,
            image: l.images,
          },
          price: l.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        }),
      },
    ],
  }
})
</script>

<style scoped>
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}
.price {
  font-size: 20px;
  font-weight: 600;
}
</style>
