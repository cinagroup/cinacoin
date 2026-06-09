// #build/types is a Nuxt virtual module generated at build time.
// We import CinacoinModuleOptions from the module source instead.
import type { CinacoinModuleOptions } from '../module'

// Nuxt virtual module, resolved at build time.
import { defineNuxtPlugin, useRuntimeConfig } from '#imports'

import { Cinacoin } from './cinacoin'

/**
 * Nuxt runtime plugin that creates a Cinacoin application instance
 * and provides it via Vue's dependency injection.
 *
 * Reads configuration from `runtimeConfig.public.cinacoin`.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.cinacoin as CinacoinModuleOptions & {
    themeMode?: 'auto' | 'dark' | 'light'
    themeVariables?: Record<string, string>
  }

  const app = new Cinacoin({
    projectId: config.projectId,
    networks: config.networks,
    metadata: config.metadata,
    themeMode: config.themeMode,
    themeVariables: config.themeVariables,
  })

  nuxtApp.provide('cinaConnect', app)

  return {
    provide: {
      cinaConnect: app,
    },
  }
})
