import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const allowedHosts = ['d62d-50-21-20-2.ngrok-free.app']

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    allowedHosts,
  },
  preview: {
    host: true,
    allowedHosts,
  },
})
