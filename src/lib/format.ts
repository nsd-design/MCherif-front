/*
 * Formatage FR : montants GNF (espace insécable), dates en toutes lettres,
 * durées. Toute donnée affichée passe par ces helpers.
 */
import type { MetricValue } from '../api/types'

const NBSP = ' ' // espace insécable (séparateur de milliers, avant l'unité)

const MONTHS_FULL = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
]

const MONTHS_SHORT = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
]

/** 100000 -> "100 000 GNF" (espace insécable comme séparateur de milliers). */
export function formatGnf(amount: number): string {
  return `${formatNumber(amount)}${NBSP}GNF`
}

/** 4812 -> "4 812" (tout séparateur d'espace normalisé en insécable). */
export function formatNumber(value: number): string {
  return value.toLocaleString('fr-FR').replace(/\s/g, NBSP)
}

function toDate(input: string | Date): Date {
  return input instanceof Date ? input : new Date(input)
}

/** ISO -> "12 juin 2026". */
export function formatDateFr(input: string | Date): string {
  const d = toDate(input)
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
}

/** ISO -> "12 juin 2026" en version abrégée avec espaces insécables. */
export function formatDateShort(input: string | Date): string {
  const d = toDate(input)
  return `${d.getDate()}${NBSP}${MONTHS_SHORT[d.getMonth()]}${NBSP}${d.getFullYear()}`
}

/** Secondes -> "58 min" / "1 h 12". */
export function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}${NBSP}min`
  return `${hours}${NBSP}h${NBSP}${minutes.toString().padStart(2, '0')}`
}

/** "2026-07" -> "juil. 2026" (abrégé, pour l'axe du graphique). */
export function formatMonth(isoMonth: string): string {
  const [year, month] = isoMonth.split('-')
  const idx = Number(month) - 1
  if (Number.isNaN(idx) || idx < 0 || idx > 11) return isoMonth
  return `${MONTHS_SHORT[idx]} ${year}`
}

/** Signe FR d'une variation numérique : 312 -> "+312", -5 -> "−5". */
export function formatSignedNumber(value: number): string {
  if (value > 0) return `+${formatNumber(value)}`
  if (value < 0) return `−${formatNumber(Math.abs(value))}`
  return formatNumber(value)
}

/*
 * Variation affichée sous un StatCard (ex. "+2 ce mois"). Le serveur renvoie
 * déjà `changeLabel` avec la valeur signée intégrée : correctif provisoire en
 * attendant un futur DTO `changeKind` côté backend, ne PAS re-préfixer avec
 * `formatSignedNumber(m.change)` sous peine de doublon ("+2 +2 ce mois").
 */
export function changeText(m?: MetricValue): string {
  return m?.changeLabel ?? ''
}
