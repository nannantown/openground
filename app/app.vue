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

<style>
html,
body,
#__nuxt {
  height: 100%;
}
body {
  font-family:
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Ubuntu,
    Cantarell,
    'Helvetica Neue',
    Arial,
    'Noto Sans',
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji',
    sans-serif;
}
</style>
