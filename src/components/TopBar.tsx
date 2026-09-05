import type { ReactNode } from 'react'
import styles from './TopBar.module.css'
import { Avatar } from './Avatar'
import { fr } from '../i18n/fr'
import { useAuthStore } from '../store/auth'

interface TopBarProps {
  /** Titre ou fil d'Ariane à gauche. */
  title: ReactNode
  /** Actions à droite (boutons), avant l'avatar. */
  actions?: ReactNode
  /** Masque l'avatar (écrans avec seulement des actions). */
  showAvatar?: boolean
}

export function TopBar({ title, actions, showAvatar = true }: TopBarProps) {
  const admin = useAuthStore((s) => s.admin)
  return (
    <header className={styles.bar}>
      <div className={styles.title}>{title}</div>
      {actions}
      {showAvatar && <Avatar initials={admin?.initials ?? fr.auth.fallbackInitials} size={34} />}
    </header>
  )
}
