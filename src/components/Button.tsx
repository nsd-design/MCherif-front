import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  leadingIcon?: ReactNode
  block?: boolean
}

export function Button({
  variant = 'secondary',
  leadingIcon,
  block = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.btn, styles[variant], block ? styles.block : '', className ?? '']
    .filter(Boolean)
    .join(' ')
  return (
    <button className={classes} {...rest}>
      {leadingIcon}
      {children}
    </button>
  )
}
