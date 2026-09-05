/*
 * Appels d'authentification. login/verify/refresh/logout/forgot/reset.
 * Ne jamais logger mot de passe, code 2FA ni jetons.
 */
import { API_PREFIX, API_ORIGIN, api, unwrap } from './http'
import { clearTokens, getAccessToken, setTokens } from './tokenStore'
import { toast } from '../store/toast'
import type { AdminSummary, TokenResponse } from './types'

/*
 * E-mail de l'admin connecté — SEULE donnée persistée, et ce n'est pas un
 * secret. Faute d'endpoint `/me`, elle sert à retrouver le profil après un
 * rechargement (le refresh, lui, est un cookie HttpOnly). Aucun jeton ne va
 * jamais dans localStorage.
 */
const EMAIL_KEY = 'mc-admin-email'

export function rememberEmail(email: string): void {
  try {
    window.localStorage.setItem(EMAIL_KEY, email)
  } catch {
    /* stockage indisponible (navigation privée) : le profil restera vide */
  }
}

export function recallEmail(): string | null {
  try {
    return window.localStorage.getItem(EMAIL_KEY)
  } catch {
    return null
  }
}

export function forgetEmail(): void {
  try {
    window.localStorage.removeItem(EMAIL_KEY)
  } catch {
    /* rien à purger */
  }
}

/**
 * Un retour sans exception garantit qu'un code 2FA a été envoyé.
 * Lève : 401 `invalid-credentials` (e-mail inconnu OU mot de passe faux — le
 * backend renvoie une réponse identique dans les deux cas, ne jamais désigner
 * l'un des deux) ; 429 `rate-limited` au-delà de 10 essais / 15 min par e-mail.
 */
export async function login(email: string, password: string): Promise<void> {
  unwrap(
    await api.POST('/api/v1/admin/auth/login', { body: { email, password } }),
  )
}

/**
 * Lève 401 `invalid-code` si le code est faux, expiré (TTL 10 min) ou si les
 * 5 tentatives sont épuisées. L'appelant doit rester sur l'écran de saisie.
 */
export async function verify(email: string, code: string): Promise<TokenResponse> {
  // La réponse pose le cookie de refresh et ne contient PAS de refreshToken :
  // seul l'access token est à notre charge.
  const tokens = unwrap(
    await api.POST('/api/v1/admin/auth/verify', { body: { email, code } }),
  )
  setTokens(tokens)
  rememberEmail(email)
  return tokens
}

/**
 * Aucun corps : le serveur identifie la session par le cookie et le renvoie
 * expiré (Max-Age=0). En `fetch` brut car l'OpenAPI déclare encore un
 * `RefreshRequest` obligatoire que le serveur ignore. Idempotent.
 */
export async function logout(): Promise<void> {
  const access = getAccessToken()
  try {
    await fetch(`${API_ORIGIN}${API_PREFIX}/admin/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: access ? { Authorization: `Bearer ${access}` } : undefined,
    })
  } catch {
    /* déconnexion locale malgré tout */
  } finally {
    clearTokens()
    forgetEmail()
  }
}

/** Lève 404 `not-found` si aucun compte ne correspond à l'e-mail. */
export async function forgotPassword(email: string): Promise<void> {
  unwrap(await api.POST('/api/v1/admin/auth/password/forgot', { body: { email } }))
}

/** Lève 401 `unauthorized` si le token de reset est invalide ou expiré (30 min). */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  unwrap(
    await api.POST('/api/v1/admin/auth/password/reset', {
      body: { token, newPassword },
    }),
  )
}

/**
 * Pas d'endpoint `/me` : on retrouve l'admin courant par son email dans la liste
 * des administrateurs (nécessite ROLE_ADMIN, déjà acquis après verify).
 */
export async function fetchCurrentAdmin(email: string): Promise<AdminSummary | null> {
  try {
    const admins = unwrap(await api.GET('/api/v1/admin/settings/admins'))
    return admins?.find((a) => a.email === email) ?? null
  } catch {
    // Échec de l'enrichissement du profil (réseau, 5xx…) : la session reste
    // valide, seuls nom/rôle resteront en repli — signaler discrètement au
    // lieu d'avaler l'erreur.
    toast.error('Profil administrateur indisponible pour le moment.')
    return null
  }
}
