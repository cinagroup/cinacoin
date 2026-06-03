import type { Cinacoin } from './cinacoin'

declare module '#app' {
  interface NuxtApp {
    /**
     * Cinacoin application instance, provided by `@cinacoin/nuxt`.
     * Access via `useNuxtApp().cinaConnect` or `nuxtApp.$cinaConnect`.
     */
    cinaConnect: Cinacoin
    $cinaConnect: Cinacoin
  }
}

// Augmentation for Vue runtime — valid for Nuxt apps at runtime.
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $cinaConnect: Cinacoin
  }
}

export {}
