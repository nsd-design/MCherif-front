import { forwardRef, useId, type SelectHTMLAttributes } from 'react'
import styles from './Field.module.css'
import { Icon } from './Icon'

interface Option {
  value: string
  label: string
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField({ label, options, id, className, ...rest }, ref) {
    const autoId = useId()
    const fieldId = id ?? autoId
    return (
      <div className={styles.field}>
        {label && (
          <label className={styles.label} htmlFor={fieldId}>
            {label}
          </label>
        )}
        <div className={styles.selectWrap}>
          <select
            ref={ref}
            id={fieldId}
            className={`${styles.control} ${className ?? ''}`}
            {...rest}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <span className={styles.selectIcon}>
            <Icon name="chevronDown" size={14} strokeWidth={2.4} />
          </span>
        </div>
      </div>
    )
  },
)
