import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './PrayerDetailPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { Card, CardTitle } from '../../components/Card'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { TextareaField } from '../../components/TextareaField'
import { ConfirmModal } from '../../components/Modal'
import { PrayerStatusBadge, AccessBadge } from '../../components/StatusBadge'
import { Skeleton } from '../../components/Skeleton'
import { usePrayer } from '../../api/hooks'
import { formatDateFr, formatDuration, formatNumber } from '../../lib/format'

export function PrayerDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: prayer, isLoading } = usePrayer(id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const title = isLoading || !prayer ? '…' : prayer.title

  return (
    <>
      <TopBar
        showAvatar={false}
        title={
          <span className={styles.crumb}>
            <span className={styles.crumbRoot}>Prêches</span>
            <span className={styles.sep}>/</span>
            <span className={styles.crumbCurrent}>{title}</span>
          </span>
        }
        actions={
          <>
            <Button variant="secondary">Renvoyer la notification</Button>
            <Button variant="secondary">Dépublier</Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Supprimer
            </Button>
          </>
        }
      />
      <PageBody tight>
        {isLoading || !prayer ? (
          <>
            <Skeleton height={64} radius="16px" />
            <Skeleton height={320} radius="16px" />
          </>
        ) : (
          <>
            <div className={styles.header}>
              <img src={prayer.coverUrl} alt="" className={styles.cover} />
              <div className={styles.headerInfo}>
                <div className={styles.headerTitle}>{prayer.title}</div>
                <div className={styles.headerMeta}>
                  Publié le {formatDateFr(prayer.recordedAt)} ·{' '}
                  {formatDuration(prayer.durationSec)} · {prayer.language}
                </div>
              </div>
              <PrayerStatusBadge status={prayer.status} />
              <AccessBadge access={prayer.access} />
            </div>

            <div className={styles.grid}>
              <Card className={styles.metaCard}>
                <CardTitle>Métadonnées</CardTitle>
                <TextField label="Titre" defaultValue={prayer.title} />
                <div className={styles.triple}>
                  <TextField label="Thème" defaultValue={prayer.theme} />
                  <TextField label="Date" defaultValue={formatDateFr(prayer.recordedAt)} />
                  <TextField label="Langue" defaultValue={prayer.language} />
                </div>
                <TextareaField label="Description courte" defaultValue={prayer.description} />
                <div className={styles.metaActions}>
                  <Button variant="primary">Enregistrer</Button>
                </div>
              </Card>

              <div className={styles.side}>
                <Card>
                  <div className={styles.drmHead}>
                    <CardTitle>État DRM</CardTitle>
                    <PrayerStatusBadge status="published" />
                  </div>
                  <dl className={styles.drmList}>
                    <div className={styles.drmRow}>
                      <dt>Fichier chiffré</dt>
                      <dd>Oui — AES-128</dd>
                    </div>
                    <div className={styles.drmRow}>
                      <dt>Clé émise le</dt>
                      <dd>{formatDateFr(prayer.recordedAt)}</dd>
                    </div>
                    <div className={styles.drmRow}>
                      <dt>Durée de licence</dt>
                      <dd>1 an</dd>
                    </div>
                  </dl>
                </Card>

                <Card>
                  <CardTitle>Statistiques</CardTitle>
                  <div className={styles.statGrid}>
                    <div className={styles.statTile}>
                      <div className={styles.statLabel}>ÉCOUTES</div>
                      <div className={styles.statValue}>
                        {prayer.plays === null ? '—' : formatNumber(prayer.plays)}
                      </div>
                    </div>
                    <div className={styles.statTile}>
                      <div className={styles.statLabel}>TÉLÉCHARGEMENTS</div>
                      <div className={styles.statValue}>{formatNumber(3208)}</div>
                    </div>
                  </div>
                  <div className={styles.statNote}>
                    Durée d'écoute moyenne : 41 min (71 %)
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </PageBody>

      <ConfirmModal
        open={confirmDelete}
        title="Supprimer ce prêche ?"
        description="Cette action est définitive. Le fichier chiffré et ses statistiques seront supprimés."
        confirmLabel="Supprimer"
        danger
        onConfirm={() => {
          setConfirmDelete(false)
          navigate('/preches')
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
