import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Cho phep Docker map port
    port: 5173,
    allowedHosts: ['erp.nemmamnon.com']
  }
})
