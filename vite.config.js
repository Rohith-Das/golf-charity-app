import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' 

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss() ],
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['react-hot-toast', '@headlessui/react'],
          supabase: ['@supabase/supabase-js'],
        }
      }
    }
  }
})
