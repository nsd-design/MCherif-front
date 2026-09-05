/*
 * Règles d'AFFICHAGE liées au rôle de l'administrateur connecté.
 *
 * Source de vérité unique : aucun `role === 'SUPER_ADMIN'` ne doit être écrit
 * ailleurs dans les composants. La matrice reflète EXACTEMENT les gardes
 * `@PreAuthorize("hasRole('SUPER_ADMIN')")` du backend (SettingsController) —
 * elle n'invente aucune règle. Notamment, la suppression d'un prêche n'y figure
 * pas : le serveur l'autorise à tout ADMIN.
 *
 * Ce n'est JAMAIS une mesure de sécurité : l'autorisation reste serveur, qui
 * répond 403. Masquer ici n'est qu'un confort d'UX.
 */
import type { AdminRole } from '../api/types'
import { useAuthStore } from '../store/auth'

export type Permission =
  | 'plans:edit'
  | 'protection:edit'
  | 'admins:invite'
  | 'admins:changeRole'
  | 'admins:remove'

/** `Record<AdminRole, …>` : l'ajout d'un rôle dans l'OpenAPI casse ici, à dessein. */
const MATRIX: Record<AdminRole, readonly Permission[]> = {
  SUPER_ADMIN: [
    'plans:edit',
    'protection:edit',
    'admins:invite',
    'admins:changeRole',
    'admins:remove',
  ],
  EDITOR: [],
}

/**
 * Règle pure, testable sans React.
 *
 * `role === null` est PERMISSIF, et c'est délibéré : le rôle est une donnée
 * best-effort (pas d'endpoint `/me` ; il est déduit par `fetchCurrentAdmin` en
 * cherchant l'admin par e-mail dans `GET /settings/admins`, et l'e-mail vient
 * de `localStorage`, effaçable). Un vidage du stockage suffit donc à produire
 * `null` sur un compte parfaitement légitime. Masquer dans ce cas amputerait
 * l'interface d'un SUPER_ADMIN sans explication ni recours, pour zéro gain de
 * sécurité — le serveur reste l'autorité. Au pire, l'action est visible et
 * répond 403, ce qui est exactement la situation actuelle.
 */
export function can(role: AdminRole | null | undefined, action: Permission): boolean {
  if (role == null) return true
  return MATRIX[role].includes(action)
}

/** À utiliser dans les composants plutôt que de lire `admin.role` directement. */
export function useCan(action: Permission): boolean {
  const role = useAuthStore((s) => s.admin?.role ?? null)
  return can(role, action)
}
