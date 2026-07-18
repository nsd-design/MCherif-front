/*
 * État d'authentification (Zustand). L'access token reste EN MÉMOIRE (via
 * api/client) — jamais en localStorage. Le backend n'existe pas encore : le
 * flux est simulé (mot de passe puis code 2FA). Le backend restera l'autorité.
 * TODO(api): brancher POST /auth/login, POST /auth/verify-2fa, refresh cookie.
 */
import { create } from 'zustand'
import { setAccessToken } from '../api/client'
import { currentAdmin } from '../api/mock/data'
import type { Admin } from '../types'

interface AuthState {
  admin: Admin | null
  isAuthenticated: boolean
  /** Vrai après mot de passe validé, en attente du code 2FA. */
  pendingTwoFa: boolean
  login: (email: string, password: string) => Promise<void>
  verifyTwoFa: (code: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  pendingTwoFa: false,

  login: async (email, password) => {
    await new Promise((r) => setTimeout(r, 500))
    if (!email || password.length < 4) {
      throw new Error('credentials')
    }
    set({ pendingTwoFa: true })
  },

  verifyTwoFa: async (code) => {
    await new Promise((r) => setTimeout(r, 500))
    if (!/^\d{6}$/.test(code)) {
      throw new Error('code')
    }
    // TODO(api): stocker l'access token renvoyé par le backend.
    setAccessToken('mock-access-token')
    set({ isAuthenticated: true, pendingTwoFa: false, admin: currentAdmin })
  },

  logout: () => {
    setAccessToken(null)
    set({ isAuthenticated: false, pendingTwoFa: false, admin: null })
  },
}))
