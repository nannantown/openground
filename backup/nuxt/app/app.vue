<template>
  <NuxtLayout>
    <NuxtPage :key="$route.fullPath" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useHead } from '#app'
import '~~/assets/css/main.css'
useHead({
  titleTemplate: (title?: string) => (title ? `${title} · Open Ground` : 'Open Ground'),
  link: [{ rel: 'icon', href: '/favicon.ico' }],
})
</script>

