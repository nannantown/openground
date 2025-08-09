<template>
  <main class="container">
    <ul ref="listEl" class="messages">
      <li v-for="m in messages" :key="m.id">
        <div class="body">{{ m.body }}</div>
        <div class="muted" style="font-size:12px">{{ fromNow(m.created_at) }}</div>
      </li>
    </ul>
    <form class="composer" @submit.prevent="send">
      <input v-model="text" placeholder="Type a message" />
      <button>Send</button>
    </form>
  </main>
  
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAsyncData, useRoute } from '#app'
import type { Message } from '~~/shared/types'
import { useChat } from '~~/composables/useChat'

const route = useRoute()
const { listMessages, sendMessage } = useChat()

const { data, refresh } = await useAsyncData(`thread:${route.params.thread}`, () => listMessages(String(route.params.thread)))
const messages = computed<Message[]>(() => data.value || [])
const text = ref('')
const listEl = ref<HTMLUListElement | null>(null)

function fromNow(iso?: string | null){
  if(!iso) return ''
  const d = new Date(iso)
  const s = (Date.now()-d.getTime())/1000
  if (s<60) return 'just now'
  if (s<3600) return `${Math.floor(s/60)}m ago`
  if (s<86400) return `${Math.floor(s/3600)}h ago`
  return `${Math.floor(s/86400)}d ago`
}

async function send() {
  if (!text.value.trim()) return
  await sendMessage(String(route.params.thread), text.value, [])
  text.value = ''
  await refresh()
}

function scrollToBottom(){
  const el = listEl.value
  if (!el) return
  requestAnimationFrame(() => {
    el.scrollTop = el.scrollHeight
  })
}

onMounted(async () => {
  scrollToBottom()
  await $fetch(`/v1/threads/${String(route.params.thread)}/read`, { method: 'POST' })
})
watch(messages, async () => {
  scrollToBottom()
  await $fetch(`/v1/threads/${String(route.params.thread)}/read`, { method: 'POST' })
})
setInterval(async () => {
  await refresh()
  await $fetch(`/v1/threads/${String(route.params.thread)}/read`, { method: 'POST' })
}, 4000)
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
