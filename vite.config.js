import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api/v1/user': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api/v1/appointment': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/v1/consultation': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/v1/statistics': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
      '/api/v1/notification': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
})
