import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react'],
          maps: ['leaflet'],
          payment: ['react-razorpay'],
          sentry: ['@sentry/react']
        }
      }
    },
    chunkSizeWarningLimit: 500
  },
});
