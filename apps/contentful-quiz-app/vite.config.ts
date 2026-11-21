import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset URLs so the bundle works wherever Contentful app hosting serves it.
  base: './',
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      // The quiz API lives in apps/web (Next dev server).
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
  },
});
