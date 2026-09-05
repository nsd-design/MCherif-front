import { useRef, type ReactNode } from 'react'
import styles from './Drawer.module.css'
import { Icon } from './Icon'
import { OverlayShell } from './OverlayShell'
import { fr } from '../i18n/fr'

interface DrawerProps {
  open: boolean
  onClose: () => void
  ariaLabel: string
  children: ReactNode
}

/** Drawer latéral droit (détail utilisateur/prêche). Voile + ombre douce. */
export function Drawer({ open, onClose, ariaLabel, children }: DrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <OverlayShell
      open={open}
      onClose={onClose}
      overlayClassName={styles.overlay}
      panelClassName={styles.panel}
      as="aside"
      ariaLabel={ariaLabel}
      initialFocusRef={closeRef}
    >
      <button
        ref={closeRef}
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label={fr.common.close}
      >
        <Icon name="close" size={18} strokeWidth={2.4} />
      </button>
      {children}
    </OverlayShell>
  )
}
