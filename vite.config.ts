import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const appBase = process.env.VITE_APP_BASE_PATH?.trim() || env.VITE_APP_BASE_PATH?.trim() || '/'
  const proxyTarget = process.env.VITE_DEV_PROXY_TARGET?.trim() || env.VITE_DEV_PROXY_TARGET?.trim() || 'http://127.0.0.1:8787'

  return {
    base: appBase,
    plugins: [vue()],
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  }
})
