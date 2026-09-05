import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'
import { Icon, type IconName } from './Icon'
import { Avatar } from './Avatar'
import { fr } from '../i18n/fr'
import { adminRoleLabel } from '../i18n/enums'
import { useAuthStore } from '../store/auth'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const ITEMS: NavItem[] = [
  { to: '/tableau-de-bord', label: fr.nav.dashboard, icon: 'dashboard' },
  { to: '/preches', label: fr.nav.prayers, icon: 'prayers' },
  { to: '/publication', label: fr.nav.publish, icon: 'publish' },
  { to: '/utilisateurs', label: fr.nav.users, icon: 'users' },
  { to: '/abonnements', label: fr.nav.payments, icon: 'payments' },
  { to: '/notifications', label: fr.nav.notifications, icon: 'notifications' },
  { to: '/parametres', label: fr.nav.settings, icon: 'settings' },
]

export function Sidebar() {
  const admin = useAuthStore((s) => s.admin)
  const logout = useAuthStore((s) => s.logout)

  return (
    <nav className={styles.sidebar} aria-label="Navigation principale">
      <div className={styles.brand}>
        <img src="/cheick.jpeg" alt="" className={styles.brandImg} />
        <div>
          <div className={styles.brandName}>{fr.app.orgName}</div>
          <div className={styles.brandRole}>{fr.app.admin}</div>
        </div>
      </div>

      <div className={styles.items}>
        {ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.item} ${isActive ? styles.active : ''}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className={styles.bar} />}
                <Icon name={item.icon} size={18} />
                <span className={styles.label}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.profile}>
          <Avatar initials={admin?.initials ?? fr.auth.fallbackInitials} size={34} />
          <div className={styles.profileInfo}>
            <div className={styles.profileName}>{admin?.fullName ?? fr.auth.fallbackName}</div>
            <div className={styles.profileRole}>{adminRoleLabel(admin?.role)}</div>
          </div>
        </div>
        <button className={styles.logout} onClick={logout}>
          {fr.nav.logout}
        </button>
      </div>
    </nav>
  )
}
