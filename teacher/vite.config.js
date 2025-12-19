import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Cổng 5174 cho Teacher
    proxy: { '/api': 'http://localhost:5000', '/uploads': 'http://localhost:5000' }
  }
})