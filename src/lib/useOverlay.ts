/*
 * Comportement partagé des surfaces superposées (Modal, ConfirmModal, Drawer).
 *
 * Ce que les trois composants réimplémentaient chacun de leur côté, et ce qui
 * leur manquait à tous :
 *  - Échap : chaque surface écoutait `window` indépendamment, donc Échap sur un
 *    ConfirmModal ouvert au-dessus d'un Drawer fermait LES DEUX. Une pile LIFO
 *    au niveau module ne ferme désormais que la surface la plus haute.
 *  - focus : aucune ne le déplaçait à l'ouverture, ne le piégeait, ni ne le
 *    restituait — le contenu derrière restait dans l'ordre de tabulation.
 *  - défilement : le corps de page restait défilable derrière le voile.
 *
 * Le verrou de défilement est compté, pas booléen : fermer une modale empilée
 * ne doit pas déverrouiller le drawer encore ouvert dessous.
 */
import { useCallback, useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

// ─── Pile Échap (module) ─────────────────────────────────────────────────────
type EscapeHandler = () => void
const escapeStack: EscapeHandler[] = []

function onWindowKeyDown(e: KeyboardEvent) {
  if (e.key !== 'Escape') return
  const top = escapeStack[escapeStack.length - 1]
  if (!top) return
  e.stopPropagation()
  top()
}

/**
 * Empile un gestionnaire d'Échap. Seul celui du sommet est appelé.
 * Exporté pour les surfaces non modales (menu déroulant) qui partagent ce
 * besoin sans partager le reste (voile, piège de focus, verrou de défilement).
 */
export function pushEscapeHandler(handler: EscapeHandler): () => void {
  escapeStack.push(handler)
  if (escapeStack.length === 1) window.addEventListener('keydown', onWindowKeyDown)
  return () => {
    const i = escapeStack.lastIndexOf(handler)
    if (i !== -1) escapeStack.splice(i, 1)
    if (escapeStack.length === 0) window.removeEventListener('keydown', onWindowKeyDown)
  }
}

// ─── Verrou de défilement compté (module) ────────────────────────────────────
let scrollLocks = 0
let previousOverflow = ''

function lockBodyScroll(): () => void {
  if (scrollLocks === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLocks += 1
  return () => {
    scrollLocks -= 1
    if (scrollLocks === 0) document.body.style.overflow = previousOverflow
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export interface UseOverlayOptions {
  open: boolean
  onClose: () => void
  /** Élément à focaliser à l'ouverture. Défaut : premier focusable du panneau. */
  initialFocusRef?: RefObject<HTMLElement | null>
  closeOnEscape?: boolean
  lockScroll?: boolean
}

export interface UseOverlayResult {
  /** À poser sur le panneau : porte le focus initial et le piège de tabulation. */
  panelRef: (node: HTMLElement | null) => void
}

export function useOverlay({
  open,
  onClose,
  initialFocusRef,
  closeOnEscape = true,
  lockScroll = true,
}: UseOverlayOptions): UseOverlayResult {
  const panelNode = useRef<HTMLElement | null>(null)
  const restoreFocusTo = useRef<HTMLElement | null>(null)

  const panelRef = useCallback((node: HTMLElement | null) => {
    panelNode.current = node
  }, [])

  // Échap — via la pile partagée, jamais un écouteur `window` par surface.
  useEffect(() => {
    if (!open || !closeOnEscape) return
    return pushEscapeHandler(onClose)
  }, [open, closeOnEscape, onClose])

  useEffect(() => {
    if (!open || !lockScroll) return
    return lockBodyScroll()
  }, [open, lockScroll])

  // Focus initial + restitution à la fermeture.
  useEffect(() => {
    if (!open) return
    restoreFocusTo.current = document.activeElement as HTMLElement | null

    const panel = panelNode.current
    const target =
      initialFocusRef?.current ??
      panel?.querySelector<HTMLElement>(FOCUSABLE) ??
      panel ??
      null
    if (target) {
      if (target === panel) panel.tabIndex = -1
      target.focus({ preventScroll: true })
    }

    return () => {
      restoreFocusTo.current?.focus({ preventScroll: true })
      restoreFocusTo.current = null
    }
  }, [open, initialFocusRef])

  // Piège de tabulation : la liste des focusables est recalculée à chaque frappe,
  // le contenu du panneau pouvant changer (chargement, sections dépliées).
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const panel = panelNode.current
      if (!panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      )
      if (items.length === 0) {
        e.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (e.shiftKey && (active === first || active === panel)) {
        e.preventDefault()
        last.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [open])

  return { panelRef }
}
