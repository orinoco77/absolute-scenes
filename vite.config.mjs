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
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['jszip', 'html2canvas', 'jspdf']
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