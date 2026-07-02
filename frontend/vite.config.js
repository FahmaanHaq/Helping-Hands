import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Avoids CORS friction during local dev; production hits the API's own origin.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
