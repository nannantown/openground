<template>
  <main class="container" style="display:grid; gap:14px">
    <h1 class="heading">Reports</h1>
    <div v-if="error" class="card" style="padding:12px">{{ error }}</div>
    <ul style="list-style:none; padding:0; display:grid; gap:8px">
      <li v-for="r in reports" :key="r.id" class="card" style="padding:12px; display:grid; gap:8px">
        <div class="row-between">
          <div class="row" style="gap:8px">
            <span class="pill">{{ r.target_type }}</span>
            <strong>{{ r.reason || '(no reason)' }}</strong>
          </div>
          <div class="row" style="gap:8px">
            <span class="muted">{{ r.status }}</span>
            <button v-if="r.status!=='resolved'" class="btn" @click="resolve(r.id)">Resolve</button>
          </div>
        </div>
        <div class="muted">{{ r.id }}</div>
      </li>
    </ul>
  </main>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAsyncData } from '#app'

const { data, refresh, error: err } = await useAsyncData('admin-reports', () => $fetch('/api/admin/reports'))
const reports = computed<any[]>(() => data.value || [])
const error = computed(() => (err.value as any)?.message || '')

async function resolve(id: string){
  await $fetch(`/api/admin/reports/${id}/resolve`, { method: 'POST' })
  await refresh()
}
</script>


