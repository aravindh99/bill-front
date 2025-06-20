import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/clients': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/client-contacts': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/vendor-contacts': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/items': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/vendors': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/quotations': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/purchase-orders': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/proformas': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/delivery-chalans': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/credit-notes': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/debit-notes': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/payments': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/profiles': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      },
      '/invoices': {
        target: 'http://localhost:5000/api',
        changeOrigin: true
      }
    }
  }
})
