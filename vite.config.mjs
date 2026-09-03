import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/](react|react-dom)[\\/]/.test(id)) return 'vendor'
            if (/[\\/](jszip|html2canvas|jspdf)[\\/]/.test(id)) return 'utils'
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    open: false
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'jszip', 'html2canvas', 'jspdf']
  }
})