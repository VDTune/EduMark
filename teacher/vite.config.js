import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Chạy port khác Student
    proxy: { '/api': 'http://localhost:10000', '/uploads': 'http://localhost:10000' }
  }
})