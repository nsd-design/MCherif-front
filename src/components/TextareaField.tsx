import { forwardRef, useId, type TextareaHTMLAttributes } from 'react'
import styles from './Field.module.css'

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, error, id, className, ...rest }, ref) {
    const autoId = useId()
    const fieldId = id ?? autoId
    return (
      <div className={styles.field}>
        {label && (
          <label className={styles.label} htmlFor={fieldId}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={`${styles.control} ${styles.textarea} ${error ? styles.error : ''} ${className ?? ''}`}
          aria-invalid={error ? true : undefined}
          {...rest}
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  },
)
