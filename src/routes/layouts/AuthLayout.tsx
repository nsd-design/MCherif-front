import { Outlet } from 'react-router-dom'
import styles from './AuthLayout.module.css'

/** Coquille des écrans d'authentification : contenu centré sur fond bg. */
export function AuthLayout() {
  return (
    <div className={styles.shell}>
      <Outlet />
    </div>
  )
}
