import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: 5173,
    // DODAJEMY PROXY:
    proxy: {
      '/api': {
        // 'backend' to nazwa serwisu z pliku docker-compose.yml!
        target: 'http://backend:8080', 
        changeOrigin: true,
        secure: false,
      }
    }
  }
})