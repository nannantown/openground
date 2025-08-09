// Minimal shims to satisfy vue-tsc during dev
// Removed direct #supabase/server usage in server routes; shim retained for other tools if referenced

declare module 'vue' {
  export interface GlobalComponents {
    // Nuxt built-ins and @nuxt/image
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    NuxtLayout: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    NuxtPage: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ClientOnly: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    NuxtLink: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    NuxtImg: any
  }
}

export {}

// Nuxt module resolution shims for tests/typecheck in CI
declare module '#app'
declare module '#imports'
