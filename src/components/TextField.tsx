import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'
import styles from './Field.module.css'
import { Icon } from './Icon'
import { fr } from '../i18n/fr'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, id, className, type, ...rest }, ref) {
    const autoId = useId()
    const fieldId = id ?? autoId
    // Bascule afficher/masquer, propre à chaque champ et jamais persistée.
    const [revealed, setRevealed] = useState(false)
    const isPassword = type === 'password'

    const input = (
      <input
        ref={ref}
        id={fieldId}
        type={isPassword && revealed ? 'text' : type}
        className={`${styles.control} ${isPassword ? styles.controlWithAction : ''} ${
          error ? styles.error : ''
        } ${className ?? ''}`}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
    )

    return (
      <div className={styles.field}>
        {label && (
          <label className={styles.label} htmlFor={fieldId}>
            {label}
          </label>
        )}
        {isPassword ? (
          <div className={styles.controlWrap}>
            {input}
            {/* type="button" impératif : sans lui, le clic soumet le formulaire. */}
            <button
              type="button"
              className={styles.reveal}
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? fr.common.hidePassword : fr.common.showPassword}
            >
              <Icon name={revealed ? 'eyeOff' : 'eye'} size={16} strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          input
        )}
        {error && <span className={styles.errorText}>{error}</span>}
      </div>
    )
  },
)
