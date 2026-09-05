/*
 * Structure commune des surfaces superposées : portail, voile cliquable,
 * panneau `role="dialog"`. Le style reste la propriété du consommateur — il
 * passe ses propres classes de CSS Module (tokens, animations) ; ce composant
 * n'en possède aucune.
 */
import { createPortal } from 'react-dom'
import type { ReactNode, ReactPortal, RefObject } from 'react'
import { useOverlay } from '../lib/useOverlay'

export interface OverlayShellProps {
  open: boolean
  onClose: () => void
  /** Classe du voile, fournie par le CSS Module du consommateur. */
  overlayClassName: string
  /** Classe du panneau, fournie par le CSS Module du consommateur. */
  panelClassName: string
  /** Élément du panneau. */
  as?: 'div' | 'aside'
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
  closeOnOverlayClick?: boolean
  initialFocusRef?: RefObject<HTMLElement | null>
  children: ReactNode
}

export function OverlayShell({
  open,
  onClose,
  overlayClassName,
  panelClassName,
  as: Panel = 'div',
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnOverlayClick = true,
  initialFocusRef,
  children,
}: OverlayShellProps): ReactPortal | null {
  const { panelRef } = useOverlay({ open, onClose, initialFocusRef })

  if (!open) return null

  return createPortal(
    <div
      className={overlayClassName}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <Panel
        ref={panelRef}
        className={panelClassName}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </Panel>
    </div>,
    document.body,
  )
}
