/*
 * Traduction FR des erreurs API (RFC 7807), indexée sur ProblemDetail.code.
 * NE JAMAIS afficher `detail` (texte technique). Repli générique si code inconnu.
 */
import { ApiError } from '../api/http'

const MESSAGES: Record<string, string> = {
  validation: 'Certains champs sont invalides.',
  malformed: 'Requête illisible.',
  'bad-request': 'Requête invalide.',
  // Login : e-mail inconnu et mot de passe faux sont INDISCERNABLES côté serveur
  // (réponse strictement identique). Ne jamais désigner l'un ou l'autre.
  'invalid-credentials': 'Identifiants invalides.',
  // Code 2FA faux, expiré, ou 5 tentatives épuisées. Distinct de `unauthorized` :
  // l'UI doit rester sur l'écran de saisie du code.
  'invalid-code': 'Code invalide. Réessayez.',
  unauthorized: 'Session expirée. Reconnectez-vous.',
  forbidden: "Vous n'avez pas les droits pour cette action.",
  'not-found': 'Élément introuvable.',
  conflict: 'Action impossible dans l’état actuel.',
  unprocessable: 'Cette opération ne respecte pas une règle métier.',
  'rate-limited': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'external-dependency': 'Un service externe est indisponible. Réessayez plus tard.',
  internal: 'Une erreur est survenue. Réessayez.',
}

const GENERIC = 'Une erreur est survenue. Réessayez.'

/** Message FR sobre pour une erreur inconnue/typée. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'validation' && error.problem.errors?.length) {
      return error.problem.errors.join(' · ')
    }
    return MESSAGES[error.code] ?? GENERIC
  }
  return GENERIC
}

/** Messages contextuels par action, prioritaires sur le générique. */
export function errorMessageFor(
  error: unknown,
  overrides: Record<string, string>,
): string {
  if (error instanceof ApiError && overrides[error.code]) {
    return overrides[error.code]
  }
  return errorMessage(error)
}
