import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { Skeleton } from '../components/Skeleton'
import styles from './ProtectedRoute.module.css'

/**
 * Garde de routes : redirige vers la connexion si non authentifié.
 *
 * Tant que le rétablissement de session au démarrage est en cours (`pending`),
 * ne rien décider : rediriger à ce moment renverrait au login à chaque
 * rechargement, avant même que le serveur ait répondu.
 *
 * La destination demandée est transmise en `state.from` pour y revenir après
 * reconnexion (cf. `LoginPage`). Le contrôle reste un confort d'UX : le backend
 * est l'autorité et répond 401/403.
 */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status)
  const location = useLocation()

  if (status === 'pending') {
    return (
      <div className={styles.pending}>
        <Skeleton height={40} />
      </div>
    )
  }
  if (status !== 'authenticated') {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }
  return <Outlet />
}
