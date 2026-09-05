/*
 * État d'authentification (Zustand). L'access token est en mémoire
 * (tokenStore) ; le refresh est un cookie HttpOnly géré par le navigateur.
 * Seul l'e-mail est persisté, pour retrouver le profil après un rechargement.
 * Le backend reste l'autorité.
 * Flux : login (mot de passe) → verify (code 2FA) → session.
 * Au démarrage : bootstrap() rejoue la session depuis le cookie.
 */
import { create } from 'zustand'
import {
  fetchCurrentAdmin,
  forgetEmail,
  login as apiLogin,
  logout as apiLogout,
  recallEmail,
  verify as apiVerify,
} from '../api/auth'
import { restoreSession, setSessionExpiredHandler } from '../api/http'
import { clearTokens } from '../api/tokenStore'
import type { AdminRole } from '../api/types'

export interface AdminProfile {
  fullName: string
  initials: string
  email: string
  role: AdminRole | null
}

/**
 * `pending` = tentative de rétablissement en cours au démarrage. Tant qu'on y
 * est, ProtectedRoute ne doit PAS rediriger, sinon le rechargement renverrait
 * visuellement au login avant même la réponse du serveur.
 */
export type AuthStatus = 'pending' | 'authenticated' | 'anonymous'

interface AuthState {
  admin: AdminProfile | null
  status: AuthStatus
  isAuthenticated: boolean
  /** Vrai après mot de passe validé, en attente du code 2FA. */
  pendingTwoFa: boolean
  loginEmail: string | null
  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  verifyTwoFa: (code: string) => Promise<void>
  logout: () => Promise<void>
  resetFlow: () => void
}

function initialsFrom(name: string, email: string): string {
  const source = name.trim() || email.split('@')[0]?.replace(/[._-]+/g, ' ') || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  const letters =
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)
  return letters.toUpperCase()
}

/*
 * Le bootstrap ne doit s'exécuter qu'une fois par chargement de page. Le
 * single-flight de http.ts protège l'appel /refresh lui-même, mais pas la
 * suite (lecture de l'e-mail + GET /settings/admins) : sous <StrictMode> le
 * double montage la déclencherait deux fois.
 */
let bootstrapPromise: Promise<void> | null = null

/** Profil best-effort : pas d'endpoint /me, on retombe sur l'e-mail. */
async function buildProfile(email: string): Promise<AdminProfile> {
  const summary = await fetchCurrentAdmin(email)
  return {
    fullName: summary?.name?.trim() || email,
    email,
    initials: initialsFrom(summary?.name ?? '', email),
    role: summary?.role ?? null,
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  status: 'pending',
  isAuthenticated: false,
  pendingTwoFa: false,
  loginEmail: null,

  /**
   * Rejoue la session au démarrage à partir du cookie de refresh. Passe par le
   * single-flight de http.ts : sous <StrictMode> l'effet est monté deux fois,
   * et la rotation étant à usage unique, deux appels réels en casseraient un.
   */
  bootstrap: () => {
    bootstrapPromise ??= (async () => {
      const restored = await restoreSession()
      if (!restored) {
        set({ status: 'anonymous', isAuthenticated: false, admin: null })
        return
      }
      // Session valide. L'e-mail peut manquer (stockage vidé) : on garde la
      // session, seul le profil reste vide.
      const email = recallEmail()
      set({
        status: 'authenticated',
        isAuthenticated: true,
        admin: email ? await buildProfile(email) : null,
        loginEmail: email,
      })
    })()
    return bootstrapPromise
  },

  login: async (email, password) => {
    // `apiLogin` lève sur identifiants refusés (401) ou rate-limit (429) : on
    // n'atteint la suite QUE si un code 2FA a réellement été envoyé.
    await apiLogin(email, password)
    set({ pendingTwoFa: true, loginEmail: email })
  },

  verifyTwoFa: async (code) => {
    const email = get().loginEmail
    if (!email) throw new Error('missing-email')
    // Pose le cookie de refresh côté navigateur et mémorise l'e-mail.
    await apiVerify(email, code)
    set({
      status: 'authenticated',
      isAuthenticated: true,
      pendingTwoFa: false,
      admin: await buildProfile(email),
    })
  },

  logout: async () => {
    try {
      await apiLogout()
    } finally {
      set({
        status: 'anonymous',
        isAuthenticated: false,
        pendingTwoFa: false,
        admin: null,
        loginEmail: null,
      })
    }
  },

  resetFlow: () => set({ pendingTwoFa: false }),
}))

// Session expirée (refresh échoué) : purge + retour à l'écran de connexion via
// ProtectedRoute (qui redirige quand isAuthenticated repasse à faux).
setSessionExpiredHandler(() => {
  clearTokens()
  forgetEmail()
  useAuthStore.setState({
    status: 'anonymous',
    isAuthenticated: false,
    pendingTwoFa: false,
    admin: null,
    loginEmail: null,
  })
})
