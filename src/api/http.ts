/*
 * Client HTTP typé (openapi-fetch) + sécurité des jetons.
 * - Access token en mémoire, ajouté en Authorization: Bearer.
 * - Sur 401 : refresh en un seul vol (single-flight) puis rejoue une fois ;
 *   si le refresh échoue → purge + signal de session expirée (redirection login).
 *   EXCEPTION : les endpoints /admin/auth/* sont exclus de ce mécanisme. Leurs
 *   401 sont métier (`invalid-credentials`, `invalid-code`, token de reset
 *   invalide) et non une session expirée : les rafraîchir puis rejouer
 *   consommerait silencieusement une des 5 tentatives de vérification.
 * - Réponses application/problem+json → ApiError (jamais `detail` à l'écran).
 * - Les listes Spring exposent un objet `pageable` : on l'aplati en page/size/sort.
 *
 * CONVENTION DES `queryKey` (TanStack Query) — à respecter dans tout `api/*.ts` :
 * une clé ne contient QUE des valeurs primitives stables, listées explicitement
 * et dans un ordre fixe, avec les mêmes valeurs par défaut que la requête HTTP.
 * Jamais d'horodatage à la milliseconde (`Date.now()`, `new Date().toISOString()`),
 * jamais de fonction, jamais un objet de filtres sérialisé tel quel. Une clé qui
 * change à chaque rendu boucle indéfiniment : la requête ne parvient jamais à
 * l'état `success`, l'écran reste en squelette et le backend est sollicité en
 * continu (régression constatée sur `/abonnements`).
 */
import createClient from 'openapi-fetch'
import type { paths } from './generated/schema'
import type { ProblemDetail, TokenResponse } from './types'
import { clearTokens, getAccessToken, setTokens } from './tokenStore'

// Vide par défaut : appels relatifs `/api/v1/...` (same-origin) → proxy Vite en
// dev, ou même origine en prod. Renseigner VITE_API_BASE_URL uniquement si l'API
// est servie sur une autre origine (le backend doit alors autoriser ce CORS,
// endpoints d'auth compris).
const ORIGIN: string = import.meta.env.VITE_API_BASE_URL ?? ''
const API_PREFIX = '/api/v1'

// ─── Erreur typée ────────────────────────────────────────────────────────────
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly problem: ProblemDetail
  constructor(problem: ProblemDetail) {
    super(problem.code) // message = code stable (jamais le detail technique)
    this.name = 'ApiError'
    this.status = problem.status
    this.code = problem.code
    this.problem = problem
  }
}

function statusToCode(status: number): string {
  switch (status) {
    case 400:
      return 'bad-request'
    case 401:
      return 'unauthorized'
    case 403:
      return 'forbidden'
    case 404:
      return 'not-found'
    case 409:
      return 'conflict'
    case 422:
      return 'unprocessable'
    case 429:
      return 'rate-limited'
    case 502:
      return 'external-dependency'
    default:
      return 'internal'
  }
}

/** Transforme le corps d'erreur openapi-fetch en ApiError. */
export function toApiError(error: unknown, status: number): ApiError {
  if (error && typeof error === 'object' && 'code' in error) {
    const p = error as ProblemDetail
    return new ApiError({ ...p, status: p.status ?? status })
  }
  return new ApiError({ status, code: statusToCode(status) })
}

/** Déballe une réponse openapi-fetch : renvoie data ou lève une ApiError. */
export function unwrap<T>(result: {
  data?: T
  error?: unknown
  response: Response
}): T {
  if (result.error !== undefined || !result.response.ok) {
    throw toApiError(result.error, result.response.status)
  }
  return result.data as T
}

// ─── Signal de session expirée (découplé du router) ──────────────────────────
let sessionExpiredHandler: (() => void) | null = null
export function setSessionExpiredHandler(fn: () => void): void {
  sessionExpiredHandler = fn
}

// ─── Refresh en un seul vol ──────────────────────────────────────────────────
let refreshInFlight: Promise<boolean> | null = null

/**
 * Rejoue la session à partir du cookie `mc_admin_refresh` (HttpOnly).
 *
 * Aucun corps : le cookie porte le refresh, `credentials: 'include'` est donc
 * indispensable. En `fetch` brut et non via le client typé, car l'OpenAPI du
 * backend déclare encore un `RefreshRequest` obligatoire alors que le serveur
 * l'ignore (vérifié : avec ou sans corps, la réponse est identique).
 *
 * Le single-flight est vital : la rotation est à usage unique, deux appels
 * concurrents en invalideraient un.
 */
async function runRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${ORIGIN}${API_PREFIX}/admin/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        clearTokens()
        return false
      }
      const tokens = (await res.json()) as TokenResponse
      setTokens(tokens) // rotation : nouvel access + nouveau cookie
      return true
    } catch {
      clearTokens()
      return false
    } finally {
      refreshInFlight = null
    }
  })()
  return refreshInFlight
}

/** Rétablissement de session au démarrage — passe par le même single-flight. */
export function restoreSession(): Promise<boolean> {
  return runRefresh()
}

/**
 * Un 401 sur /admin/auth/* est une erreur métier (identifiants, code 2FA, token
 * de reset), jamais une session expirée : ne pas déclencher refresh + rejeu.
 */
function isAuthEndpoint(url: string): boolean {
  return new URL(url, window.location.origin).pathname.startsWith(`${API_PREFIX}/admin/auth/`)
}

// ─── fetch avec Bearer + refresh/retry sur 401 ───────────────────────────────
async function apiFetch(input: Request): Promise<Response> {
  const withAuth = (): Request => {
    const req = input.clone()
    const access = getAccessToken()
    if (access) req.headers.set('Authorization', `Bearer ${access}`)
    return req
  }

  let res = await fetch(withAuth())
  // Le front ne peut plus savoir si un cookie de refresh existe (HttpOnly) :
  // on tente donc systématiquement, sauf sur les routes d'auth elles-mêmes.
  if (res.status === 401 && !isAuthEndpoint(input.url)) {
    const refreshed = await runRefresh()
    if (refreshed) {
      res = await fetch(withAuth())
    } else {
      sessionExpiredHandler?.()
    }
  }
  return res
}

// ─── Sérialisation des query : aplatir le `pageable` de Spring ───────────────
function querySerializer(query: Record<string, unknown>): string {
  const sp = new URLSearchParams()
  const append = (key: string, value: unknown) => {
    if (value == null) return
    if (Array.isArray(value)) value.forEach((v) => sp.append(key, String(v)))
    else sp.append(key, String(value))
  }
  for (const [key, value] of Object.entries(query)) {
    if (value == null) continue
    if (key === 'pageable' && typeof value === 'object') {
      const p = value as { page?: number; size?: number; sort?: string | string[] }
      append('page', p.page)
      append('size', p.size)
      append('sort', p.sort)
    } else {
      append(key, value)
    }
  }
  return sp.toString()
}

export const api = createClient<paths>({
  baseUrl: ORIGIN,
  fetch: apiFetch,
  querySerializer,
  // Obligatoire pour que le navigateur émette le cookie de refresh sur les
  // routes /admin/auth (il est limité à ce Path côté serveur).
  credentials: 'include',
})

export const AUTH_PREFIX = `${API_PREFIX}/admin/auth`
export { ORIGIN as API_ORIGIN, API_PREFIX }
