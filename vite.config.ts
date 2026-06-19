import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages project site: https://powerpower2005.github.io/krft-dashboard/
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? '/krft-dashboard/',
})
