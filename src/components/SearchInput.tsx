import type { InputHTMLAttributes } from 'react'
import styles from './SearchInput.module.css'
import { Icon } from './Icon'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  width?: number | string
}

export function SearchInput({ width = 300, className, ...rest }: SearchInputProps) {
  return (
    <div className={`${styles.wrap} ${className ?? ''}`} style={{ width }}>
      <span className={styles.icon}>
        <Icon name="search" size={15} />
      </span>
      <input type="search" className={styles.input} {...rest} />
    </div>
  )
}
