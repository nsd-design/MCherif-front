import styles from './DashboardPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { StatCard } from '../../components/StatCard'
import { Card, CardTitle } from '../../components/Card'
import { RevenueChart } from '../../components/RevenueChart'
import { ProgressBar } from '../../components/ProgressBar'
import { Skeleton, SkeletonRows } from '../../components/Skeleton'
import {
  useActivity,
  useDashboardStats,
  useEncodingJobs,
  useRevenueSeries,
} from '../../api/hooks'
import { fr } from '../../i18n/fr'
import { formatGnf } from '../../lib/format'

export function DashboardPage() {
  const stats = useDashboardStats()
  const revenue = useRevenueSeries()
  const jobs = useEncodingJobs()
  const activity = useActivity()

  return (
    <>
      <TopBar title={fr.nav.dashboard} showSearch />
      <PageBody>
        {/* Cartes de statistiques */}
        <div className={styles.stats}>
          {stats.isLoading || !stats.data
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton width={90} height={12} />
                  <div className={styles.mt}>
                    <Skeleton width={120} height={26} />
                  </div>
                </Card>
              ))
            : (() => {
                const s = stats.data
                return (
                  <>
                    <StatCard label="Utilisateurs actifs" value={s.activeUsers.value} change={s.activeUsers.change} />
                    <StatCard label="Abonnements actifs" value={s.activeSubscriptions.value} change={s.activeSubscriptions.change} />
                    <StatCard label="Revenus du mois" value={formatGnf(s.monthlyRevenueGnf.value)} change={s.monthlyRevenueGnf.change} />
                    <StatCard label="Prêches publiés" value={s.publishedPrayers.value} change={s.publishedPrayers.change} />
                  </>
                )
              })()}
        </div>

        {/* Graphique + encodage */}
        <div className={styles.row}>
          <Card className={styles.chartCard}>
            <div className={styles.chartHead}>
              <CardTitle>Revenus — 12 derniers mois</CardTitle>
              <span className={styles.pill}>GNF</span>
            </div>
            {revenue.isLoading || !revenue.data ? (
              <Skeleton height={200} radius="12px" />
            ) : (
              <RevenueChart data={revenue.data} />
            )}
          </Card>

          <Card className={styles.encodingCard}>
            <CardTitle>En cours d'encodage</CardTitle>
            <div className={styles.jobs}>
              {jobs.isLoading || !jobs.data ? (
                <SkeletonRows rows={2} height={40} />
              ) : jobs.data.length === 0 ? (
                <div className={styles.empty}>Aucun encodage en cours</div>
              ) : (
                jobs.data.map((job) => (
                  <div key={job.id} className={styles.job}>
                    <div className={styles.jobHead}>
                      <span className={styles.jobTitle}>{job.title}</span>
                      <span className={styles.jobPct}>{job.progress} %</span>
                    </div>
                    <div className={styles.jobStep}>{job.stepLabel}</div>
                    <ProgressBar value={job.progress} />
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Activité récente */}
        <Card>
          <CardTitle>Activité récente</CardTitle>
          <div className={styles.activity}>
            {activity.isLoading || !activity.data ? (
              <SkeletonRows rows={4} height={18} />
            ) : (
              activity.data.map((item) => (
                <div key={item.id} className={styles.activityRow}>
                  <span className={`${styles.dot} ${styles[item.kind]}`} />
                  <span className={styles.activityText}>{item.text}</span>
                  <span className={styles.activityMeta}>{item.timeLabel}</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </PageBody>
    </>
  )
}
