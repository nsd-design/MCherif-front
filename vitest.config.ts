import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/*
 * Séparé de vite.config.ts : Vitest ne fusionne pas les deux si les deux
 * existent (il ignorerait vite.config.ts). Le proxy /api dev-only n'a de
 * toute façon rien à faire ici — VITE_API_BASE_URL force une origine
 * absolue en test, MSW intercepte les appels réels.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000',
    },
  },
})
