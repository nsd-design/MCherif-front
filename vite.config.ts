import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    server: {
      // Proxy de dev : le front appelle /api/... en same-origin ; Vite relaie
      // vers le backend côté serveur. On retire l'en-tête Origin pour que le
      // backend ne traite pas la requête comme une requête CORS (ses endpoints
      // publics d'auth n'ont pas de config CORS).
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
            })
          },
        },
      },
    },
  }
})
