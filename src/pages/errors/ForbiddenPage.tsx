import { useNavigate } from 'react-router-dom'
import styles from './ForbiddenPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { Card } from '../../components/Card'
import { Button } from '../../components/Button'

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <>
      <TopBar title="Accès refusé" showAvatar={false} />
      <PageBody>
        <Card className={styles.card}>
          <div className={styles.title}>Accès refusé</div>
          <div className={styles.message}>
            Vous n'avez pas les droits nécessaires pour accéder à cette page.
          </div>
          <Button variant="primary" onClick={() => navigate('/tableau-de-bord')}>
            Retour au tableau de bord
          </Button>
        </Card>
      </PageBody>
    </>
  )
}
