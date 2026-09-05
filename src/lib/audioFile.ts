/*
 * Validation client du fichier audio avant envoi — miroir des contraintes
 * serveur (`src/docs/apiBackoffice.md` : upload audio) pour éviter un
 * aller-retour réseau complet avant un rejet 422 côté serveur.
 */

const ACCEPTED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'application/octet-stream',
])

const MAX_SIZE_BYTES = 500 * 1024 * 1024 // 500 Mo

/** Renvoie un message d'erreur FR si le fichier est rejeté, `null` sinon. */
export function validateAudioFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return 'Format non pris en charge. Formats acceptés : MP3, WAV, M4A.'
  }
  if (file.size > MAX_SIZE_BYTES) {
    return 'Fichier trop volumineux (500 Mo maximum).'
  }
  return null
}
