import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../shell-prod-server/dist/react-shell-app',
    emptyOutDir: false
  }
})
