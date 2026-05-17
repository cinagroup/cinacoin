import type { CinaConnect } from '@cinaconnect/vue'

declare module '#app' {
  interface NuxtApp {
    /**
     * CinaConnect application instance, provided by `@cinaconnect/nuxt`.
     * Access via `useNuxtApp().cinaConnect` or `nuxtApp.$cinaConnect`.
     */
    cinaConnect: CinaConnect
    $cinaConnect: CinaConnect
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $cinaConnect: CinaConnect
  }
}

export {}
