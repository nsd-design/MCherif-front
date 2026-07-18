import styles from './Avatar.module.css'

interface AvatarProps {
  initials: string
  size?: number
  /** 'solid' = fond primary/texte contrasté (topbar) ; 'soft' = teinté (listes). */
  variant?: 'solid' | 'soft'
}

/** Pastille d'initiales. */
export function Avatar({ initials, size = 34, variant = 'solid' }: AvatarProps) {
  return (
    <span
      className={`${styles.avatar} ${styles[variant]}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </span>
  )
}
