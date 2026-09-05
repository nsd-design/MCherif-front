import styles from './DashboardPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { StatCard } from '../../components/StatCard'
import { Card, CardTitle } from '../../components/Card'
import { RevenueChart } from '../../components/RevenueChart'
import { ProgressBar } from '../../components/ProgressBar'
import { Skeleton, SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import { useActivity, useDashboardStats, useEncodingJobs, useRevenue } from '../../api/dashboard'
import { fr } from '../../i18n/fr'
import { formatGnf, formatNumber, formatSignedNumber, formatDateShort } from '../../lib/format'
import type { ActivityItem, EncodingState, MetricValue } from '../../api/types'

function changeText(m?: MetricValue): string {
  if (!m) return ''
  const label = m.changeLabel ?? ''
  return `${formatSignedNumber(m.change ?? 0)} ${label}`.trim()
}

const STATE_LABEL: Record<EncodingState, string> = {
  UPLOADED: 'Téléversement…',
  TRANSCODING: 'Transcodage audio…',
  ENCRYPTING: 'Chiffrement DRM…',
  READY: 'Prêt',
  FAILED: 'Échec',
}

function activityKind(item: ActivityItem): string {
  const t = `${item.type ?? ''} ${item.text ?? ''}`.toLowerCase()
  if (/fail|échec|echec|error|erreur/.test(t)) return styles.danger
  if (/account|compte|inscription|nouveau/.test(t)) return styles.neutral
  return styles.success
}

export function DashboardPage() {
  const stats = useDashboardStats()
  const revenue = useRevenue(12)
  const jobs = useEncodingJobs()
  const activity = useActivity(10)

  return (
    <>
      <TopBar title={fr.nav.dashboard} showSearch />
      <PageBody>
        <div className={styles.stats}>
          {stats.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <Skeleton width={90} height={12} />
                <div className={styles.mt}>
                  <Skeleton width={120} height={26} />
                </div>
              </Card>
            ))
          ) : stats.isError || !stats.data ? (
            <Card className={styles.span4}>
              <ErrorState error={stats.error} onRetry={() => stats.refetch()} />
            </Card>
          ) : (
            <>
              <StatCard label="Utilisateurs actifs" value={formatNumber(stats.data.activeUsers?.value ?? 0)} change={changeText(stats.data.activeUsers)} />
              <StatCard label="Abonnements actifs" value={formatNumber(stats.data.activeSubscriptions?.value ?? 0)} change={changeText(stats.data.activeSubscriptions)} />
              <StatCard label="Revenus du mois" value={formatGnf(stats.data.monthlyRevenueGnf?.value ?? 0)} change={changeText(stats.data.monthlyRevenueGnf)} />
              <StatCard label="Prêches publiés" value={formatNumber(stats.data.publishedPrayers?.value ?? 0)} change={changeText(stats.data.publishedPrayers)} />
            </>
          )}
        </div>

        <div className={styles.row}>
          <Card className={styles.chartCard}>
            <div className={styles.chartHead}>
              <CardTitle>Revenus — 12 derniers mois</CardTitle>
              <span className={styles.pill}>GNF</span>
            </div>
            {revenue.isLoading ? (
              <Skeleton height={200} radius="12px" />
            ) : revenue.isError || !revenue.data ? (
              <ErrorState error={revenue.error} onRetry={() => revenue.refetch()} />
            ) : (
              <RevenueChart data={revenue.data} />
            )}
          </Card>

          <Card className={styles.encodingCard}>
            <CardTitle>En cours d'encodage</CardTitle>
            <div className={styles.jobs}>
              {jobs.isLoading ? (
                <SkeletonRows rows={2} height={40} />
              ) : jobs.isError || !jobs.data ? (
                <ErrorState error={jobs.error} onRetry={() => jobs.refetch()} />
              ) : jobs.data.length === 0 ? (
                <div className={styles.empty}>Aucun encodage en cours</div>
              ) : (
                jobs.data.map((job) => (
                  <div key={job.prayerId} className={styles.job}>
                    <div className={styles.jobHead}>
                      <span className={styles.jobTitle}>{job.title}</span>
                      <span className={styles.jobPct}>{job.progress ?? 0} %</span>
                    </div>
                    <div className={styles.jobStep}>{STATE_LABEL[job.state ?? 'UPLOADED']}</div>
                    <ProgressBar value={job.progress ?? 0} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card>
          <CardTitle>Activité récente</CardTitle>
          <div className={styles.activity}>
            {activity.isLoading ? (
              <SkeletonRows rows={4} height={18} />
            ) : activity.isError || !activity.data ? (
              <ErrorState error={activity.error} onRetry={() => activity.refetch()} />
            ) : activity.data.length === 0 ? (
              <div className={styles.empty}>Aucune activité récente</div>
            ) : (
              activity.data.map((item, i) => (
                <div key={i} className={styles.activityRow}>
                  <span className={`${styles.dot} ${activityKind(item)}`} />
                  <span className={styles.activityText}>{item.text}</span>
                  <span className={styles.activityMeta}>
                    {item.meta ?? (item.at ? formatDateShort(item.at) : '')}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </PageBody>
    </>
  )
}
