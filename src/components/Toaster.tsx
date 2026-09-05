import { createPortal } from 'react-dom'
import styles from './Toaster.module.css'
import { Icon } from './Icon'
import { useToastStore } from '../store/toast'

/** Conteneur des toasts (monté une fois dans App). */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return createPortal(
    <div className={styles.stack} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[t.kind]}`}>
          <span className={styles.message}>{t.message}</span>
          <button
            className={styles.close}
            onClick={() => dismiss(t.id)}
            aria-label="Fermer"
          >
            <Icon name="close" size={14} strokeWidth={2.4} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
