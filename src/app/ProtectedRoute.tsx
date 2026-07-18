import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

/** Garde de routes : redirige vers la connexion si non authentifié. */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/connexion" replace />
  }
  return <Outlet />
}
