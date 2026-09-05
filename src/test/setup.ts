import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { server } from './msw/server'

// `test.globals: false` désactive l'auto-cleanup de Testing Library — appel
// manuel obligatoire, sinon le DOM fuit d'un test à l'autre dans un même fichier.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  cleanup()
})
afterAll(() => server.close())
