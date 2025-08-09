<template>
  <main class="container">
    <h1>New Listing</h1>
    <form @submit.prevent="submit">
      <input v-model="title" placeholder="Title" required />
      <textarea v-model="description" placeholder="Description" />
      <input v-model.number="price" type="number" placeholder="Price" />
      <input v-model="category" placeholder="Category" />
      <button :disabled="pending">Create</button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#app'
import { useListings } from '~~/composables/useListings'
import { useAuth } from '~~/composables/useAuth'

const { user } = useAuth()
const { createListing } = useListings()

const title = ref('')
const description = ref('')
const price = ref<number | undefined>()
const category = ref('')
const pending = ref(false)

async function submit() {
  if (!user.value) return navigateTo('/auth')
  pending.value = true
  try {
    const listing = await createListing({
      title: title.value,
      description: description.value,
      price: price.value,
      category: category.value,
      images: [],
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
