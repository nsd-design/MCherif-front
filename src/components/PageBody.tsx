import type { ReactNode } from 'react'
import styles from './PageBody.module.css'

interface PageBodyProps {
  children: ReactNode
  /** Padding haut réduit (24) pour les pages avec barre de filtres. */
  tight?: boolean
}

/** Zone de contenu défilable sous la top bar (padding 32). */
export function PageBody({ children, tight = false }: PageBodyProps) {
  return (
    <div className={`${styles.body} ${tight ? styles.tight : ''}`}>{children}</div>
  )
}
