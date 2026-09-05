/*
 * Stockage de l'ACCESS TOKEN — en mémoire uniquement (variable de module).
 *
 * Le refresh n'est plus manipulé par le front : le backend le pose dans un
 * cookie `mc_admin_refresh` (HttpOnly, Secure, SameSite=Strict,
 * Path=/api/v1/admin/auth). Le JavaScript n'y a pas accès — c'est précisément
 * ce qui protège la session d'une exfiltration par XSS. Ne jamais tenter de le
 * lire ni de le recopier ailleurs.
 *
 * Le cookie survivant au rechargement, la session est rétablie au démarrage via
 * `POST /admin/auth/refresh` (voir store/auth.ts → bootstrap).
 */
import type { TokenResponse } from './types'

let accessToken: string | null = null
let accessExpiresAt: number | null = null // epoch ms

/** N'exploite que `accessToken`/`expiresIn` : le refresh part en cookie. */
export function setTokens(tokens: TokenResponse): void {
  accessToken = tokens.accessToken ?? null
  accessExpiresAt =
    tokens.expiresIn != null ? Date.now() + tokens.expiresIn * 1000 : null
}

export function clearTokens(): void {
  accessToken = null
  accessExpiresAt = null
}

export function getAccessToken(): string | null {
  return accessToken
}

export function hasSession(): boolean {
  return accessToken !== null
}

export function isAccessExpired(): boolean {
  return accessExpiresAt !== null && Date.now() >= accessExpiresAt
}
