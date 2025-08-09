<template>
  <main class="container" style="display:grid; gap:14px">
    <h1 class="heading">My Listings</h1>
    <div v-if="!user" class="card" style="padding:12px">
      <NuxtLink class="btn" href="/login">Sign in</NuxtLink>
    </div>
    <ul v-else class="grid" style="list-style:none; padding:0">
      <li v-for="l in mine" :key="l.id" class="card" style="padding:12px; display:grid; gap:8px">
        <div class="row-between">
          <strong>{{ l.title }}</strong>
          <span class="muted">{{ l.status }}</span>
        </div>
        <div class="row" style="gap:8px">
          <button class="btn" type="button" @click="setStatus(l.id, 'active')">Active</button>
          <button class="btn" type="button" @click="setStatus(l.id, 'sold')">Sold</button>
          <button class="btn" type="button" @click="setStatus(l.id, 'hidden')">Hidden</button>
          <NuxtLink class="btn" :href="`/listing/${l.id}`">Open</NuxtLink>
        </div>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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

async function setStatus(id: string, status: 'active'|'sold'|'hidden'){
  if (!user.value) return navigateTo('/login')
  await $fetch(`/api/listings/${id}/status`, { method: 'POST', body: { status } })
  await refresh()
}
</script>


