<template>
  <main class="container">
    <ul class="messages">
      <li v-for="m in messages" :key="m.id">
        <div class="body">{{ m.body }}</div>
      </li>
    </ul>
    <form class="composer" @submit.prevent="send">
      <input v-model="text" placeholder="Type a message" />
      <button>Send</button>
    </form>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAsyncData, useRoute } from '#app'
import type { Message } from '~~/shared/types'
import { useChat } from '~~/composables/useChat'

const route = useRoute()
const { listMessages, sendMessage } = useChat()

const { data, refresh } = await useAsyncData(`thread:${route.params.thread}`, () =>
  listMessages(String(route.params.thread)),
)
const messages = computed<Message[]>(() => data.value || [])
const text = ref('')

async function send() {
  if (!text.value.trim()) return
  await sendMessage(String(route.params.thread), text.value, [])
  text.value = ''
  await refresh()
}
</script>

<style scoped>
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
  display: grid;
  gap: 12px;
}
.messages {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 8px;
}
.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}
input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
button {
  padding: 10px 14px;
}
</style>
