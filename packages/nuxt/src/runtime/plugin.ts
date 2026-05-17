import type { CinaConnectModuleOptions } from '#build/types'

import { defineNuxtPlugin, useRuntimeConfig, useNuxtApp } from '#imports'
import { CinaConnect } from '@cinaconnect/vue'

/**
 * Nuxt runtime plugin that creates a CinaConnect application instance
 * and provides it via Vue's dependency injection.
 *
 * Reads configuration from `runtimeConfig.public.cinaconnect`.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig().public.cinaconnect as CinaConnectModuleOptions & {
    themeMode?: 'auto' | 'dark' | 'light'
    themeVariables?: Record<string, string>
  }

  const app = new CinaConnect({
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
