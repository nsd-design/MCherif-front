import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import type { AdminRole } from '../api/types'

interface RequireRoleProps {
  roles: AdminRole[]
}

/**
 * Garde de route par rôle, composable sous `ProtectedRoute` (qui reste un
 * garde générique auth-only). `role === null` reste PERMISSIF, même
 * rationale que `lib/permissions.ts` : rôle best-effort (pas d'endpoint
 * `/me`), le backend reste l'autorité et répond 403 au pire.
 *
 * Non appliquée à une route existante pour l'instant : le RBAC serveur est
 * au niveau action (@PreAuthorize par endpoint), pas par page — aucune route
 * n'est aujourd'hui réservée à un rôle. Prête pour une future page qui le
 * serait.
 */
export function RequireRole({ roles }: RequireRoleProps) {
  const role = useAuthStore((s) => s.admin?.role ?? null)
  if (role !== null && !roles.includes(role)) {
    return <Navigate to="/acces-refuse" replace />
  }
  return <Outlet />
}
