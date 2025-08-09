<template>
  <main class="container">
    <h1 class="heading">New Listing</h1>
    <form @submit.prevent="submit" class="card" style="padding:16px; display:grid; gap:12px">
      <input v-model="title" class="input" placeholder="Title" required />
      <textarea v-model="description" class="input" placeholder="Description" rows="5" />
      <div class="row" style="gap:8px">
        <input v-model.number="price" class="input" type="number" placeholder="Price" style="max-width:200px" />
        <input v-model="category" class="input" placeholder="Category" style="max-width:240px" />
      </div>

      <div class="row" style="gap:8px">
        <input v-model.number="lat" class="input" type="number" step="0.000001" placeholder="Latitude" />
        <input v-model.number="lng" class="input" type="number" step="0.000001" placeholder="Longitude" />
        <button class="btn" type="button" @click="useCurrentLocation">Use current</button>
      </div>

      <div class="card" style="padding:12px; display:grid; gap:8px">
        <div class="row-between">
          <strong>Images</strong>
          <input type="file" multiple accept="image/*" @change="onPick" />
        </div>
        <div class="grid grid-cols-3" style="gap:8px">
          <img v-for="(u,i) in imageUrls" :key="i" :src="u" style="width:100%; aspect-ratio:4/3; object-fit:cover" />
        </div>
      </div>

      <button class="btn btn-primary" :disabled="pending">Create</button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo, useSupabaseClient } from '#app'
import { useListings } from '~~/composables/useListings'
import { useAuth } from '~~/composables/useAuth'
import { randomUUID } from 'uncrypto'

const { user } = useAuth()
const { createListing } = useListings()
const supabase = useSupabaseClient()

const title = ref('')
const description = ref('')
const price = ref<number | undefined>()
const category = ref('')
const pending = ref(false)
const lat = ref<number | undefined>()
const lng = ref<number | undefined>()
const imageUrls = ref<string[]>([])

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const uploads: string[] = []
  for (const file of Array.from(input.files)) {
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `listings/staged/${randomUUID()}.${ext}`
    const { error } = await supabase.storage.from('listing-images').upload(path, file, {
      cacheControl: '3600', upsert: true, contentType: file.type,
    })
    if (error) {
      // eslint-disable-next-line no-alert
      alert(`Upload failed: ${error.message}`)
      continue
    }
    const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
    uploads.push(data.publicUrl)
  }
  imageUrls.value = uploads
}

function useCurrentLocation() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition((pos) => {
    lat.value = pos.coords.latitude
    lng.value = pos.coords.longitude
  })
}

async function submit() {
  if (!user.value) return navigateTo('/auth')
  pending.value = true
  try {
    const listing = await createListing({
      title: title.value,
      description: description.value,
      price: price.value,
      category: category.value,
      images: imageUrls.value,
      lat: lat.value,
      lng: lng.value,
    })
    await navigateTo(`/listing/${listing.id}`)
  } finally {
    pending.value = false
  }
}
</script>

<style scoped>
.container {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
}
form {
  display: grid;
  gap: 12px;
}
input,
textarea {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
button {
  padding: 10px 14px;
}
</style>
