import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  build: {
    outDir: 'out',
    sourcemap: true,
    target: 'esnext',
    rollupOptions: {
      external: ['node:crypto'],
    },
  },
  optimizeDeps: {
    exclude: ['@cinacoin/telegram-miniapp'],
  },
});
