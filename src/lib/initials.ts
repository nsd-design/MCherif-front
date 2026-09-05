/** Initiales (2 lettres MAJ) depuis un nom, avec repli sur un numéro/texte. */
export function initials(name: string | null | undefined, fallback = '?'): string {
  const source = (name ?? '').trim()
  if (!source) {
    const digits = fallback.replace(/\D/g, '')
    return digits.slice(-2) || fallback.slice(0, 2).toUpperCase()
  }
  const parts = source.split(/\s+/).filter(Boolean)
  const letters = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)
  return letters.toUpperCase()
}
