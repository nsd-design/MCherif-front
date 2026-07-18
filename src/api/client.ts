/*
 * Wrapper fetch typé + intercepteur JWT/refresh.
 * Le backend Spring Boot et sa spec OpenAPI n'existent pas encore : ce client
 * est prêt mais n'est pas branché (les hooks passent par la couche mock).
 *
 * TODO(api): remplacer par openapi-fetch et les types générés :
 *   import createClient from 'openapi-fetch'
 *   import type { paths } from './generated/schema'
 *   export const api = createClient<paths>({ baseUrl: API_BASE_URL })
 */

export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/** Access token conservé EN MÉMOIRE uniquement (jamais localStorage). */
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

/**
 * Rafraîchit l'access token via l'endpoint dédié (idéalement cookie httpOnly).
 * TODO(api): implémenter l'appel réel puis rejouer la requête d'origine.
 */
async function refreshAccessToken(): Promise<boolean> {
  // Placeholder : renvoie false tant que le backend n'est pas disponible.
  return false
}

export interface RequestOptions extends RequestInit {
  /** Rejoue une fois après refresh si 401. */
  retryOnUnauthorized?: boolean
}

/**
 * Requête typée avec en-tête Authorization et gestion du 401 (refresh puis retry).
 * TODO(api): utiliser les types de paths générés pour url et réponse.
 */
export async function request<T>(
  path: string,
  { retryOnUnauthorized = true, headers, ...init }: RequestOptions = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  })

  if (res.status === 401 && retryOnUnauthorized) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(path, { ...init, headers, retryOnUnauthorized: false })
    }
  }

  if (!res.ok) {
    throw new Error(`Erreur API ${res.status}`)
  }

  return res.json() as Promise<T>
}
