import styles from './PrayerDrawer.module.css'
import { Drawer } from '../../components/Drawer'
import { Icon } from '../../components/Icon'
import { PrayerStatusBadge, AccessBadge } from '../../components/StatusBadge'
import { SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { usePrayer } from '../../api/prayers'
import { formatDateFr, formatDuration, formatNumber } from '../../lib/format'

interface PrayerDrawerProps {
  prayerId: string | null
  onClose: () => void
}

function licenceLabel(days?: number): string {
  if (!days) return '—'
  if (days % 365 === 0) return `${days / 365} an${days / 365 > 1 ? 's' : ''}`
  return `${days} jours`
}

/** Détail lecture seule d'un prêche — les actions (éditer/publier/supprimer) restent sur l'écran d'édition. */
export function PrayerDrawer({ prayerId, onClose }: PrayerDrawerProps) {
  const { data: prayer, isLoading, isError, error, refetch } = usePrayer(prayerId ?? '')

  return (
    <Drawer open={prayerId !== null} onClose={onClose} ariaLabel="Détail prêche">
      {isLoading || !prayer ? (
        isError ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : (
          <SkeletonRows rows={6} height={40} />
        )
      ) : (
        <>
          <div className={styles.head}>
            <span className={styles.cover}>
              <Icon name="audio" size={20} />
            </span>
            <div className={styles.headInfo}>
              <div className={styles.name}>{prayer.title}</div>
              <div className={styles.meta}>
                {prayer.publishedAt
                  ? `Publié le ${formatDateFr(prayer.publishedAt)}`
                  : prayer.recordedOn
                    ? `Enregistré le ${formatDateFr(prayer.recordedOn)}`
                    : 'Non publié'}{' '}
                · {formatDuration(prayer.durationSec ?? 0)} · {prayer.language ?? '—'}
              </div>
            </div>
          </div>

          <div className={styles.badgeRow}>
            {prayer.status && <PrayerStatusBadge status={prayer.status} />}
            {prayer.access && <AccessBadge access={prayer.access} />}
          </div>

          <div className={styles.sectionLabel}>ÉTAT DRM</div>
          <dl className={styles.drmList}>
            <div className={styles.drmRow}>
              <dt>Fichier chiffré</dt>
              <dd>{prayer.protection?.encrypted ? 'Oui — AES-128' : 'Non'}</dd>
            </div>
            <div className={styles.drmRow}>
              <dt>Clé émise le</dt>
              <dd>
                {prayer.protection?.keyRotatedAt ? formatDateFr(prayer.protection.keyRotatedAt) : '—'}
              </dd>
            </div>
            <div className={styles.drmRow}>
              <dt>Durée de licence</dt>
              <dd>{licenceLabel(prayer.protection?.premiumValidityDays)}</dd>
            </div>
          </dl>

          <div className={styles.sectionLabel}>STATISTIQUES</div>
          <div className={styles.statGrid}>
            <div className={styles.statTile}>
              <div className={styles.statLabel}>ÉCOUTES</div>
              <div className={styles.statValue}>{formatNumber(prayer.stats?.playCount ?? 0)}</div>
            </div>
            <div className={styles.statTile}>
              <div className={styles.statLabel}>TÉLÉCHARGEMENTS</div>
              <div className={styles.statValue}>{formatNumber(prayer.stats?.downloadCount ?? 0)}</div>
            </div>
          </div>
          <div className={styles.statNote}>
            Durée d'écoute moyenne : {formatDuration(prayer.stats?.avgListenSec ?? 0)} (
            {prayer.stats?.avgListenPct ?? 0} %)
          </div>
        </>
      )}
    </Drawer>
  )
}
