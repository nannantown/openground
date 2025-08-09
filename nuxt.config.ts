import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase', '@pinia/nuxt', '@vueuse/nuxt', '@nuxt/image'],
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  compatibilityDate: '2025-07-15',
  nitro: {
    preset: 'vercel',
    routeRules: {
      '/v1/**': { cors: true },
    },
  },
  runtimeConfig: {
    stripeSecret: '',
    supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    public: {
      supabase: {
        url: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
        key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '',
      },
    },
  },
  routeRules: {
    '/': { swr: 60 },
    '/listing/**': { swr: 300 },
  },
  future: {
    typescriptBundlerResolution: true,
  },
})
