<template>
  <main class="container" style="display:grid; gap:14px">
    <h1 class="heading">Favourites</h1>
    <div v-if="!user" class="card" style="padding:12px">
      <NuxtLink class="btn" href="/login">Sign in to view your favourites</NuxtLink>
    </div>
    <ul v-else class="grid" style="list-style:none; padding:0">
      <li v-for="l in favListings" :key="l.id" class="card" style="padding:8px">
        <NuxtLink :href="`/listing/${l.id}`" style="display:block">
          <img :src="(l.images?.[0]||placeholder)" style="width:100%; aspect-ratio:4/3; object-fit:cover" />
          <div style="padding:8px">
            <div class="row-between"><strong>{{ l.title }}</strong><span>¥{{ toPrice(l.price) }}</span></div>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAsyncData } from '#app'
import { useAuth } from '~~/composables/useAuth'
import { useFavourites } from '~~/composables/useFavourites'
import { useListings } from '~~/composables/useListings'
import type { Listing } from '~~/shared/types'

const { user } = useAuth()
const { listFavouriteIds } = useFavourites()
const { searchListings } = useListings()

const { data } = await useAsyncData('favs', async () => {
  if (!user.value) return [] as Listing[]
  const ids = await listFavouriteIds()
  if (!ids.length) return [] as Listing[]
  // naive fetch: filter client-side
  const all = await searchListings()
  return all.filter((l) => ids.includes(l.id))
})

const favListings = computed<Listing[]>(() => data.value || [])
const placeholder = 'https://picsum.photos/seed/ogfav/800/600'
function toPrice(v?: number | string | null){
  if (v===null || v===undefined) return '-'
  const n = typeof v==='string'? Number(v): v
  return n.toLocaleString('ja-JP')
}
</script>


