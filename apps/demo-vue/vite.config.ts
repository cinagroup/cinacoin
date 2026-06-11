import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Resolve SDK to source for development (SDK build is broken)
      '@cinacoin/vue': resolve(__dirname, '../../packages/vue/src'),
    },
  },
  server: {
    port: 3001,
    open: true,
  },
})
