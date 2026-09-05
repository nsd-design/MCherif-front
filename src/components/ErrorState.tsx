import styles from './ErrorState.module.css'
import { Button } from './Button'
import { errorMessage } from '../i18n/errors'

interface ErrorStateProps {
  error: unknown
  onRetry?: () => void
}

/** État d'erreur inline (message FR traduit + réessayer). */
export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className={styles.wrap} role="alert">
      <div className={styles.message}>{errorMessage(error)}</div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  )
}
