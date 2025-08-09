<template>
  <main class="container">
    <h1>Profile {{ uid }}</h1>
    <p>Coming soon.</p>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from '#app'
const route = useRoute()
const uid = computed(() => String(route.params.uid))
</script>

<style scoped>
.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px;
}
</style>
