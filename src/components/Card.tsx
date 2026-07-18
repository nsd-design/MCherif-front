import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Retire le padding interne (utile pour les tables). */
  flush?: boolean
}

export function Card({ children, flush = false, className, ...rest }: CardProps) {
  const classes = [styles.card, flush ? styles.flush : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className={styles.title}>{children}</div>
}
