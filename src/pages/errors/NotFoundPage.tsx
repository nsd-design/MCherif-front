import { useNavigate } from 'react-router-dom'
import styles from './NotFoundPage.module.css'
import { Button } from '../../components/Button'

/*
 * Route de repli `*` : hors ProtectedRoute/AppLayout (doit attraper un chemin
 * inconnu qu'on soit connecté ou non) — coquille autonome, pas de TopBar/
 * PageBody qui supposent la sidebar de l'app. Même patron que
 * AuthLayout.module.css (.shell) pour rester cohérent visuellement.
 */
export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.title}>Page introuvable</div>
        <div className={styles.message}>Cette adresse ne correspond à aucune page du back-office.</div>
        <Button variant="primary" onClick={() => navigate('/tableau-de-bord')}>
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  )
}
