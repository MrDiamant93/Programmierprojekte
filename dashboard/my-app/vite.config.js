import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // API-Container auf dem Host
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/db/init/api'),
      },
    },
  },
})
