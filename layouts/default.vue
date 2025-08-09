<template>
  <div>
    <header
      class="card row-between"
      style="
        padding: 12px 16px;
        margin: 12px;
        position: sticky;
        top: 8px;
        z-index: 10;
        backdrop-filter: blur(10px);
      "
    >
      <NuxtLink to="/" class="row" style="gap: 10px">
        <div class="pill" style="background: var(--og-accent); color: #0b0b0c; font-weight: 800">OG</div>
        <strong>Open Ground</strong>
      </NuxtLink>
      <nav class="row" style="gap: 8px">
        <NuxtLink class="btn" to="/">Browse</NuxtLink>
        <NuxtLink class="btn" to="/favourites">Favourites</NuxtLink>
        <NuxtLink class="btn" to="/new-listing">Post</NuxtLink>
        <NuxtLink class="btn" to="/me/listings">My</NuxtLink>
      </nav>
    </header>
    <main class="container" style="padding: 8px 0 40px">
      <slot />
    </main>
    <ClientOnly>
      <div id="toasts" />
    </ClientOnly>
  </div>
  
</template>

<script setup lang="ts">
// no-op
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


