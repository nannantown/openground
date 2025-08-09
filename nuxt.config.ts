import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase', '@pinia/nuxt', '@vueuse/nuxt', '@nuxt/image'],
  // @ts-expect-error: module options are typed via module augmentations in runtime
  supabase: {
    // Disable global auth redirects; pages manage auth gating explicitly
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/auth',
      exclude: [
        '/',
        '/listing/**',
        '/favourites',
        '/login',
        '/auth',
        '/sitemap.xml',
        '/robots.txt',
      ],
    },
  },
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
    adminEmails: process.env.ADMIN_EMAILS || '',
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
