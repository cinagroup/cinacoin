/**
 * Stub for Nuxt's virtual #imports module.
 * At build time Nuxt replaces this with actual imports.
 * For typecheck, we provide the key types used by this package.
 */
export {
  defineNuxtPlugin,
  defineNuxtModule,
  useNuxtApp,
  useRuntimeConfig,
  addPlugin,
  addImportsDir,
  addComponent,
  addTemplate,
  createResolver,
  type NuxtPlugin,
  type NuxtModule,
  type NuxtApp,
} from 'nuxt/app'

export {
  defineEventHandler,
  getHeader,
  getRequestHeader,
  getRequestURL,
  sendRedirect,
  sendError,
  createError,
  type H3Event,
  type EventHandlerRequest,
} from 'h3'
