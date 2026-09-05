import { setupServer } from 'msw/node'

/** Aucun handler de base : chaque fichier de test enregistre les siens via `server.use(...)`. */
export const server = setupServer()
