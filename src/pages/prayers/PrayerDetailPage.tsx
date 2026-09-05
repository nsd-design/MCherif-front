import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styles from './PrayerDetailPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { Card, CardTitle } from '../../components/Card'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { TextareaField } from '../../components/TextareaField'
import { SegmentedControl } from '../../components/SegmentedControl'
import { ConfirmModal } from '../../components/Modal'
import { PrayerStatusBadge, AccessBadge } from '../../components/StatusBadge'
import { Skeleton } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import {
  usePrayer,
  useUpdatePrayer,
  useSetAccess,
  usePublishPrayer,
  useUnpublishPrayer,
  useNotifyPrayer,
  useDeletePrayer,
} from '../../api/prayers'
import { toast } from '../../store/toast'
import { errorMessage, errorMessageFor } from '../../i18n/errors'
import { formatDateFr, formatDuration, formatNumber } from '../../lib/format'
import type { PrayerAccess } from '../../api/types'

function licenceLabel(days?: number): string {
  if (!days) return '—'
  if (days % 365 === 0) return `${days / 365} an${days / 365 > 1 ? 's' : ''}`
  return `${days} jours`
}

export function PrayerDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: prayer, isLoading, isError, error, refetch } = usePrayer(id)

  const update = useUpdatePrayer(id)
  const setAccess = useSetAccess(id)
  const publish = usePublishPrayer(id)
  const unpublish = useUnpublishPrayer(id)
  const notify = useNotifyPrayer(id)
  const remove = useDeletePrayer()

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({ title: '', theme: '', language: '', description: '' })
  const [access, setAccessState] = useState<PrayerAccess>('PREMIUM')

  // Synchronise le formulaire quand un nouveau prêche est chargé (ajustement
  // d'état en phase de rendu — recommandé plutôt qu'un effet, cf. React docs).
  const [loadedId, setLoadedId] = useState<string | null>(null)
  if (prayer && prayer.id != null && prayer.id !== loadedId) {
    setLoadedId(prayer.id)
    setForm({
      title: prayer.title ?? '',
      theme: prayer.theme ?? '',
      language: prayer.language ?? '',
      description: prayer.description ?? '',
    })
    setAccessState(prayer.access ?? 'PREMIUM')
  }

  async function handleSave() {
    try {
      await update.mutateAsync({
        title: form.title,
        theme: form.theme || undefined,
        language: form.language || undefined,
        description: form.description || undefined,
      })
      if (prayer && access !== prayer.access) {
        await setAccess.mutateAsync(access)
      }
      toast.success('Prêche enregistré.')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function handlePublishToggle() {
    try {
      if (prayer?.status === 'PUBLISHED') {
        await unpublish.mutateAsync()
        toast.success('Prêche dépublié.')
      } else {
        await publish.mutateAsync(false)
        toast.success('Prêche publié.')
      }
    } catch (e) {
      toast.error(
        errorMessageFor(e, {
          unprocessable: 'Publication impossible : le média chiffré n’est pas prêt.',
        }),
      )
    }
  }

  async function handleNotify() {
    try {
      await notify.mutateAsync()
      toast.success('Notification renvoyée.')
    } catch (e) {
      toast.error(errorMessageFor(e, { unprocessable: 'Le prêche doit être publié.' }))
    }
  }

  async function handleDelete() {
    try {
      await remove.mutateAsync(id)
      setConfirmDelete(false)
      toast.success('Prêche supprimé.')
      navigate('/preches')
    } catch (e) {
      setConfirmDelete(false)
      toast.error(
        errorMessageFor(e, { conflict: 'Dépubliez le prêche avant de le supprimer.' }),
      )
    }
  }

  return (
    <>
      <TopBar
        showAvatar={false}
        title={
          <span className={styles.crumb}>
            <span className={styles.crumbRoot}>Prêches</span>
            <span className={styles.sep}>/</span>
            <span className={styles.crumbCurrent}>{prayer?.title ?? '…'}</span>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" onClick={handleNotify} disabled={notify.isPending}>
              Renvoyer la notification
            </Button>
            <Button
              variant="secondary"
              onClick={handlePublishToggle}
              disabled={publish.isPending || unpublish.isPending}
            >
              {prayer?.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Supprimer
            </Button>
          </>
        }
      />
      <PageBody tight>
        {isLoading ? (
          <>
            <Skeleton height={64} radius="16px" />
            <Skeleton height={320} radius="16px" />
          </>
        ) : isError || !prayer ? (
          <Card>
            <ErrorState error={error} onRetry={() => refetch()} />
          </Card>
        ) : (
          <>
            <div className={styles.header}>
              <img src="/cheick.jpeg" alt="" className={styles.cover} />
              <div className={styles.headerInfo}>
                <div className={styles.headerTitle}>{prayer.title}</div>
                <div className={styles.headerMeta}>
                  {prayer.publishedAt
                    ? `Publié le ${formatDateFr(prayer.publishedAt)}`
                    : prayer.recordedOn
                      ? `Enregistré le ${formatDateFr(prayer.recordedOn)}`
                      : 'Non publié'}{' '}
                  · {formatDuration(prayer.durationSec ?? 0)} · {prayer.language ?? '—'}
                </div>
              </div>
              {prayer.status && <PrayerStatusBadge status={prayer.status} />}
              {prayer.access && <AccessBadge access={prayer.access} />}
            </div>

            <div className={styles.grid}>
              <Card className={styles.metaCard}>
                <CardTitle>Métadonnées</CardTitle>
                <TextField
                  label="Titre"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <div className={styles.triple}>
                  <TextField
                    label="Thème"
                    value={form.theme}
                    onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
                  />
                  <TextField
                    label="Langue"
                    value={form.language}
                    onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                  />
                  <div className={styles.accessField}>
                    <span className={styles.accessLabel}>Accès</span>
                    <SegmentedControl<PrayerAccess>
                      ariaLabel="Accès"
                      value={access}
                      onChange={setAccessState}
                      segments={[
                        { value: 'FREE', label: 'Gratuit' },
                        { value: 'PREMIUM', label: 'Premium' },
                      ]}
                    />
                  </div>
                </div>
                <TextareaField
                  label="Description courte"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
                <div className={styles.metaActions}>
                  <Button variant="primary" onClick={handleSave} disabled={update.isPending}>
                    {update.isPending ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </div>
              </Card>

              <div className={styles.side}>
                <Card>
                  <div className={styles.drmHead}>
                    <CardTitle>État DRM</CardTitle>
                    <PrayerStatusBadge status={prayer.protection?.encrypted ? 'PUBLISHED' : 'DRAFT'} />
                  </div>
                  <dl className={styles.drmList}>
                    <div className={styles.drmRow}>
                      <dt>Fichier chiffré</dt>
                      <dd>{prayer.protection?.encrypted ? 'Oui — AES-128' : 'Non'}</dd>
                    </div>
                    <div className={styles.drmRow}>
                      <dt>Clé émise le</dt>
                      <dd>
                        {prayer.protection?.keyRotatedAt
                          ? formatDateFr(prayer.protection.keyRotatedAt)
                          : '—'}
                      </dd>
                    </div>
                    <div className={styles.drmRow}>
                      <dt>Durée de licence</dt>
                      <dd>{licenceLabel(prayer.protection?.premiumValidityDays)}</dd>
                    </div>
                  </dl>
                </Card>

                <Card>
                  <CardTitle>Statistiques</CardTitle>
                  <div className={styles.statGrid}>
                    <div className={styles.statTile}>
                      <div className={styles.statLabel}>ÉCOUTES</div>
                      <div className={styles.statValue}>{formatNumber(prayer.stats?.playCount ?? 0)}</div>
                    </div>
                    <div className={styles.statTile}>
                      <div className={styles.statLabel}>TÉLÉCHARGEMENTS</div>
                      <div className={styles.statValue}>
                        {formatNumber(prayer.stats?.downloadCount ?? 0)}
                      </div>
                    </div>
                  </div>
                  <div className={styles.statNote}>
                    Durée d'écoute moyenne : {formatDuration(prayer.stats?.avgListenSec ?? 0)} (
                    {prayer.stats?.avgListenPct ?? 0} %)
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
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
