/*
 * Miroir JS des couleurs des tokens, pour les consommateurs qui exigent une
 * chaîne de couleur (Recharts, pastilles de moyen de paiement colorées).
 * Seul fichier .ts autorisé à contenir des littéraux hex (cf. eslint.config.js).
 * Doit rester synchronisé avec theme/tokens.css.
 */
import type { Theme } from './useTheme'

export interface ThemePalette {
  primary: string
  primarySoft: string
  primaryContrast: string
  text: string
  textMuted: string
  textFaint: string
  surface: string
  border: string
  grid: string
}

const light: ThemePalette = {
  primary: '#0e7a45',
  primarySoft: '#e4f1e9',
  primaryContrast: '#ffffff',
  text: '#17201b',
  textMuted: '#6b7570',
  textFaint: '#9aa39d',
  surface: '#ffffff',
  border: '#e7e5e0',
  grid: '#eceae4',
}

const dark: ThemePalette = {
  primary: '#35a46c',
  primarySoft: 'rgba(53,164,108,0.14)',
  primaryContrast: '#0e1511',
  text: '#f2f4f1',
  textMuted: '#9aa79f',
  textFaint: '#77817b',
  surface: '#1b221d',
  border: '#2a332d',
  grid: '#2a332d',
}

export const palettes: Record<Theme, ThemePalette> = { light, dark }

/** Couleurs de marque des moyens de paiement (fixes, hors thème). */
export const paymentColors = {
  orange: { bg: '#ff7900', fg: '#ffffff' },
  mtn: { bg: '#ffcc00', fg: '#17201b' },
  card: { bg: '#17201b', fg: '#ffffff' },
} as const
