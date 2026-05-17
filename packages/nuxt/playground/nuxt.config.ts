import { defineNuxtConfig } from 'nuxt/config'

/**
 * Playground Nuxt config for testing @cinaconnect/nuxt locally.
 *
 * Run with: `pnpm dev` from the nuxt package root.
 */
export default defineNuxtConfig({
  modules: ['../src/module'],

  cinaconnect: {
    projectId: process.env.NUXT_PUBLIC_CINACONNECT_PROJECT_ID ?? 'YOUR_PROJECT_ID',
    networks: ['mainnet', 'arbitrum', 'base'],
    metadata: {
      name: 'CinaConnect Nuxt Playground',
      description: 'Development playground for @cinaconnect/nuxt',
      url: 'https://localhost:3000',
    },
    themeMode: 'auto',
  },

  devtools: { enabled: true },

  compatibilityDate: '2025-01-01',
})
