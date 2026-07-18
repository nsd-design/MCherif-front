import styles from './SettingsPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { Card, CardTitle } from '../../components/Card'
import { Button } from '../../components/Button'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { RoleBadge } from '../../components/StatusBadge'
import { SegmentedControl } from '../../components/SegmentedControl'
import { SkeletonRows } from '../../components/Skeleton'
import { useAdmins, usePlans } from '../../api/hooks'
import { useTheme, type Theme } from '../../theme/useTheme'
import { formatGnf } from '../../lib/format'
import { fr } from '../../i18n/fr'

const DRM_ROWS = [
  ['Chiffrement', 'AES-128 (HLS)'],
  ['Durée de licence', '1 an'],
  ['Rotation des clés', 'À chaque publication'],
  ['Appareils max. par compte', '3'],
]

export function SettingsPage() {
  const plans = usePlans()
  const admins = useAdmins()
  const { theme, setTheme } = useTheme()

  return (
    <>
      <TopBar title={fr.nav.settings} showAvatar={false} />
      <PageBody tight>
        <div className={styles.grid}>
          {/* Plans & tarifs */}
          <Card>
            <div className={styles.cardHead}>
              <CardTitle>Plans & tarifs</CardTitle>
              <Button variant="secondary" className={styles.smallBtn}>
                Modifier
              </Button>
            </div>
            <div className={styles.plans}>
              {plans.isLoading || !plans.data ? (
                <SkeletonRows rows={2} height={44} />
              ) : (
                plans.data.map((plan) => (
                  <div
                    key={plan.kind}
                    className={`${styles.plan} ${plan.badge ? styles.planFeatured : ''}`}
                  >
                    {plan.badge && <span className={styles.planBadge}>{plan.badge}</span>}
                    <div>
                      <div className={styles.planName}>{plan.name}</div>
                      <div className={styles.planSub}>{plan.subtitle}</div>
                    </div>
                    <div className={styles.planPrice}>
                      {formatGnf(plan.priceGnf)}{' '}
                      <span className={styles.planPeriod}>{plan.periodLabel}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Configuration DRM */}
          <Card>
            <div className={styles.drmHead}>
              <CardTitle>Configuration DRM</CardTitle>
              <span className={styles.readonly}>
                <Icon name="lock" size={14} />
                LECTURE SEULE
              </span>
            </div>
            <dl className={styles.drmList}>
              {DRM_ROWS.map(([label, value]) => (
                <div key={label} className={styles.drmRow}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {/* Comptes administrateurs */}
          <Card>
            <div className={styles.cardHead}>
              <CardTitle>Comptes administrateurs</CardTitle>
              <Button variant="secondary" className={styles.smallBtn}>
                Inviter
              </Button>
            </div>
            <div className={styles.admins}>
              {admins.isLoading || !admins.data ? (
                <SkeletonRows rows={3} height={32} />
              ) : (
                admins.data.map((admin) => (
                  <div key={admin.id} className={styles.admin}>
                    <Avatar initials={admin.initials} size={32} variant="soft" />
                    <div className={styles.adminInfo}>
                      <div className={styles.adminName}>{admin.fullName}</div>
                      <div className={styles.adminEmail}>{admin.email}</div>
                    </div>
                    <RoleBadge role={admin.role} />
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Apparence */}
          <Card>
            <CardTitle>Apparence</CardTitle>
            <div className={styles.themeRow}>
              <div>
                <div className={styles.themeTitle}>Thème de l'interface</div>
                <div className={styles.themeSub}>
                  S'applique à ce back-office uniquement
                </div>
              </div>
              <SegmentedControl<Theme>
                ariaLabel="Thème"
                value={theme}
                onChange={setTheme}
                segments={[
                  { value: 'light', label: 'Clair' },
                  { value: 'dark', label: 'Sombre' },
                ]}
              />
            </div>
          </Card>
        </div>
      </PageBody>
    </>
  )
}
