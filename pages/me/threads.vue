<template>
  <main class="container" style="display: grid; gap: 14px">
    <h1 class="heading">My Chats</h1>
    <div v-if="!user" class="card" style="padding: 12px">
      <NuxtLink class="btn" href="/login">Sign in</NuxtLink>
    </div>
    <ul v-else style="list-style: none; padding: 0; display: grid; gap: 8px">
      <li
        v-for="t in threads"
        :key="t.id"
        class="card"
        style="padding: 12px; display: grid; gap: 8px"
      >
        <div class="row-between">
          <strong>{{ t.id }}</strong>
          <span class="muted">{{ fromNow(t.updated_at) }}</span>
        </div>
        <div class="muted">{{ t.last_message }}</div>
        <NuxtLink class="btn" :href="`/chat/${t.id}`">Open</NuxtLink>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAsyncData } from '#app'
import { useAuth } from '~~/composables/useAuth'

const { user } = useAuth()
const { data } = await useAsyncData<any[]>('my-threads', async () => {
  if (!user.value) return []
  return await $fetch('/api/me/threads')
})
const threads = computed<any[]>(() => data.value || [])

function fromNow(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  const s = (Date.now() - d.getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
</script>
