import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analysis: run with `ANALYZE=true pnpm build`
    visualizer({
      enabled: process.env.ANALYZE === 'true',
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  base: '/',
  
  // Performance: Dependency optimization
  optimizeDeps: {
    include: [
      '@walletconnect/ethereum-provider',
      '@cinacoin/core-sdk',
      'react',
      'react-dom',
    ],
    exclude: [],
  },

  // Performance: Build optimizations
  build: {
    // Enable source maps for debugging (disable in production if needed)
    sourcemap: process.env.NODE_ENV !== 'production',
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },

    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-cinacoin': ['@cinacoin/core-sdk'],
          'vendor-walletconnect': ['@walletconnect/ethereum-provider'],
        },
        // Asset file names with hash for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Performance: Server options
  server: {
    port: 3000,
    strictPort: false,
  },

  // Performance: Preview options
  preview: {
    port: 4173,
  },
})
