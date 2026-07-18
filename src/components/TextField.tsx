import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import styles from './Field.module.css'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, id, className, ...rest }, ref) {
    const autoId = useId()
    const fieldId = id ?? autoId
    return (
      <div className={styles.field}>
        {label && (
          <label className={styles.label} htmlFor={fieldId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={fieldId}
          className={`${styles.control} ${error ? styles.error : ''} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  },
)
