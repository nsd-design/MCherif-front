import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Drawer.module.css'
import { Icon } from './Icon'

interface DrawerProps {
  open: boolean
  onClose: () => void
  ariaLabel: string
  children: ReactNode
}

/** Drawer latéral droit (détail utilisateur/prêche). Voile + ombre douce. */
export function Drawer({ open, onClose, ariaLabel, children }: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <aside
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.close} onClick={onClose} aria-label="Fermer">
          <Icon name="close" size={18} strokeWidth={2.4} />
        </button>
        {children}
      </aside>
    </div>,
    document.body,
  )
}
