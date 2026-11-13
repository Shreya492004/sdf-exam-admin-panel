import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Sends /api requests to the NestJS backend (backend/), so the panel and API share one origin.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
