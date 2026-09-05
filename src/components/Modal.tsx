import { useId, type ReactNode } from 'react'
import styles from './Modal.module.css'
import { Button } from './Button'
import { OverlayShell } from './OverlayShell'
import { fr } from '../i18n/fr'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  /** Id d'un élément décrivant le dialogue (`aria-describedby`). */
  describedBy?: string
  children: ReactNode
}

/** Modale générique (formulaire). Voile + Échap pour fermer. */
export function Modal({ open, title, onClose, describedBy, children }: ModalProps) {
  const titleId = useId()
  return (
    <OverlayShell
      open={open}
      onClose={onClose}
      overlayClassName={styles.overlay}
      panelClassName={styles.dialog}
      ariaLabelledBy={titleId}
      ariaDescribedBy={describedBy}
    >
      <div className={styles.title} id={titleId}>
        {title}
      </div>
      {children}
    </OverlayShell>
  )
}

interface ConfirmModalProps {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Modale de confirmation (suppression, action sensible).
 * Bâtie sur `Modal` : une seule implémentation de portail/voile/Échap.
 * Le focus initial tombe sur Annuler, premier élément focalisable du panneau —
 * ces dialogues sont souvent destructifs.
 */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = fr.common.confirm,
  cancelLabel = fr.common.cancel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const descriptionId = useId()

  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      describedBy={description ? descriptionId : undefined}
    >
      {description && (
        <div className={styles.description} id={descriptionId}>
          {description}
        </div>
      )}
      <div className={styles.actions}>
        <Button variant="secondary" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
