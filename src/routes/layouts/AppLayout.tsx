import { Outlet } from 'react-router-dom'
import styles from './AppLayout.module.css'
import { Sidebar } from '../../components/Sidebar'

/** Coquille de l'admin : sidebar fixe + colonne de contenu (top bar + page). */
export function AppLayout() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Outlet />
      </div>
    </div>
  )
}
