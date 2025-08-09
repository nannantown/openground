<template>
  <main class="container" v-if="listing">
    <div class="gallery">
      <NuxtImg
        v-for="(img, i) in listing.images as string[]"
        :key="i"
        :src="img"
        :alt="listing.title"
        width="640"
        height="480"
      />
    </div>
    <h1>{{ listing.title }}</h1>
    <p class="price">{{ formatPrice(listing.price) }}</p>
    <p>{{ listing.description }}</p>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useAsyncData, useHead } from '#app'
import type { Listing } from '~~/shared/types'
import { useListings } from '~~/composables/useListings'

const route = useRoute()
const { getListing } = useListings()

const { data } = await useAsyncData(
  `listing:${route.params.id}`,
  () => getListing(String(route.params.id)),
  { server: true },
)
const listing = computed<Listing | null>(() => data.value || null)

function formatPrice(p?: number | null) {
  if (p == null) return ''
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(p))
}

useHead(() => {
  if (!listing.value) return {}
  const l = listing.value
  return {
    title: l.title,
    meta: [
      { name: 'description', content: l.description || '' },
      { property: 'og:title', content: l.title },
      { property: 'og:description', content: l.description || '' },
      { property: 'og:type', content: 'product' },
      l.images?.[0] ? { property: 'og:image', content: l.images[0] as string } : undefined,
    ].filter(Boolean) as any,
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Product',
            name: l.title,
            description: l.description,
            image: l.images,
          },
          price: l.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        }),
      },
    ],
  }
})
</script>

<style scoped>
.container {
  max-width: 960px;
  margin: 0 auto;
  padding: 16px;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}
.price {
  font-size: 20px;
  font-weight: 600;
}
</style>
