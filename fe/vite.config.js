import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = process.env.VITE_API_TARGET || 'http://localhost:4000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        timeout: 0,        // SSE 장시간 연결 유지 (타임아웃 없음)
        proxyTimeout: 0,
      },
      '/uploads': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
