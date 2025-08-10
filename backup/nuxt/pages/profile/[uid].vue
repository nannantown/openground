<template>
  <main class="container" style="display:grid; gap:14px">
    <div class="row-between">
      <h1 class="heading">Profile {{ uid }}</h1>
      <NuxtLink class="btn" href="/">Back</NuxtLink>
    </div>

    <section class="card" style="padding:16px; display:grid; gap:8px">
      <strong>Reviews</strong>
      <ul style="list-style:none; padding:0; display:grid; gap:8px">
        <li v-for="r in reviews" :key="r.id" class="card" style="padding:12px">
          <div class="row-between">
            <span>⭐️ {{ r.rating }}</span>
            <span class="muted">{{ fromNow(r.created_at) }}</span>
          </div>
          <div>{{ r.comment }}</div>
        </li>
      </ul>
      <form class="row" style="gap:8px" @submit.prevent="addReview">
        <input v-model.number="rating" class="input" type="number" min="1" max="5" placeholder="1-5" style="max-width:100px" />
        <input v-model="comment" class="input" placeholder="Leave a comment" />
        <button class="btn btn-primary">Post</button>
      </form>
    </section>

    <section class="card" style="padding:16px; display:grid; gap:8px">
      <strong>Report</strong>
      <form class="row" style="gap:8px" @submit.prevent="reportUser">
        <input v-model="reason" class="input" placeholder="Reason" />
        <button class="btn">Report</button>
      </form>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useAsyncData, navigateTo } from '#app'
import { getSupabaseServerClient } from '~~/server/utils/supabase'
import { useAuth } from '~~/composables/useAuth'
const route = useRoute()
const uid = computed(() => String(route.params.uid))
const { user } = useAuth()

const { data: reviewsData, refresh } = await useAsyncData(`reviews:${uid.value}`, async () => {
  const res = await $fetch('/api/profile/reviews', { query: { uid: uid.value } })
  return res as any[]
})
const reviews = computed(() => reviewsData.value || [])

const rating = ref<number | undefined>()
const comment = ref('')
const reason = ref('')

function fromNow(iso?: string){
  if (!iso) return ''
  const d = new Date(iso)
  const s = (Date.now()-d.getTime())/1000
  if (s<60) return 'just now'
  if (s<3600) return `${Math.floor(s/60)}m ago`
  if (s<86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

async function addReview(){
  if (!user.value) return navigateTo('/login')
  await $fetch('/api/profile/reviews', { method: 'POST', body: { to_uid: uid.value, rating: rating.value, comment: comment.value } })
  rating.value = undefined
  comment.value = ''
  await refresh()
}

async function reportUser(){
  if (!user.value) return navigateTo('/login')
  await $fetch('/api/profile/report', { method: 'POST', body: { target_id: uid.value, reason: reason.value, target_type: 'user' } })
  reason.value = ''
}
</script>

<style scoped>
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}
</style>
