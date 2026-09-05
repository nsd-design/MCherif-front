import { useState } from 'react'
import styles from './SettingsPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { Card, CardTitle } from '../../components/Card'
import { Button } from '../../components/Button'
import { Avatar } from '../../components/Avatar'
import { Icon } from '../../components/Icon'
import { RoleBadge } from '../../components/StatusBadge'
import { SegmentedControl } from '../../components/SegmentedControl'
import { SelectField } from '../../components/SelectField'
import { TextField } from '../../components/TextField'
import { Modal, ConfirmModal } from '../../components/Modal'
import { SkeletonRows } from '../../components/Skeleton'
import { ErrorState } from '../../components/ErrorState'
import {
  useAdmins,
  useDeleteAdmin,
  useInviteAdmin,
  usePlans,
  useProtection,
  useUpdatePlans,
} from '../../api/settings'
import { useCan } from '../../lib/permissions'
import { toast } from '../../store/toast'
import { errorMessage, errorMessageFor } from '../../i18n/errors'
import { adminRoleLabel, planCodeLabel } from '../../i18n/enums'
import { initials } from '../../lib/initials'
import { formatGnf } from '../../lib/format'
import { useTheme, type Theme } from '../../theme/useTheme'
import { fr } from '../../i18n/fr'
import type { AdminRole, PlanResponse } from '../../api/types'

export function SettingsPage() {
  const plans = usePlans()
  const protection = useProtection()
  const admins = useAdmins()
  const updatePlans = useUpdatePlans()
  const invite = useInviteAdmin()
  const removeAdmin = useDeleteAdmin()
  const { theme, setTheme } = useTheme()

  // Le serveur restreint ces actions au SUPER_ADMIN (@PreAuthorize sur
  // SettingsController). On masque ici pour éviter un 403 après coup ; la
  // décision reste serveur.
  // `protection:edit` et `admins:changeRole` n'ont pas encore d'UI (voir F-07,
  // hors périmètre ici) — pas de useCan tant qu'il n'y a rien à gater.
  const canEditPlans = useCan('plans:edit')
  const canInvite = useCan('admins:invite')
  const canRemoveAdmin = useCan('admins:remove')

  const [editingPlans, setEditingPlans] = useState<PlanResponse[] | null>(null)
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('EDITOR')
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null)

  async function savePlans() {
    if (!editingPlans) return
    try {
      await updatePlans.mutateAsync(
        editingPlans.map((p) => ({
          code: p.code ?? '',
          priceGnf: p.priceGnf,
          durationDays: p.durationDays,
          label: p.label,
        })),
      )
      toast.success('Tarifs mis à jour.')
      setEditingPlans(null)
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function sendInvite() {
    if (!inviteEmail.trim()) {
      toast.error("Renseignez l'adresse e-mail.")
      return
    }
    try {
      await invite.mutateAsync({ email: inviteEmail, role: inviteRole })
      toast.success('Invitation envoyée.')
      setInviting(false)
      setInviteEmail('')
    } catch (e) {
      toast.error(errorMessage(e))
    }
  }

  async function confirmDeleteAdmin() {
    if (!adminToDelete) return
    try {
      await removeAdmin.mutateAsync(adminToDelete)
      toast.success('Administrateur retiré.')
    } catch (e) {
      toast.error(
        errorMessageFor(e, { conflict: 'Impossible de retirer le dernier super administrateur.' }),
      )
    } finally {
      setAdminToDelete(null)
    }
  }

  return (
    <>
      <TopBar title={fr.nav.settings} showAvatar={false} />
      <PageBody tight>
        <div className={styles.grid}>
          {/* Plans & tarifs */}
          <Card>
            <div className={styles.cardHead}>
              <CardTitle>Plans & tarifs</CardTitle>
              {canEditPlans && (
                <Button
                  variant="secondary"
                  className={styles.smallBtn}
                  onClick={() => setEditingPlans(plans.data ? [...plans.data] : [])}
                  disabled={!plans.data}
                >
                  Modifier
                </Button>
              )}
            </div>
            <div className={styles.plans}>
              {plans.isLoading ? (
                <SkeletonRows rows={2} height={44} />
              ) : plans.isError || !plans.data ? (
                <ErrorState error={plans.error} onRetry={() => plans.refetch()} />
              ) : (
                plans.data.map((plan) => (
                  <div
                    key={plan.code}
                    className={`${styles.plan} ${plan.code === 'ANNUAL' ? styles.planFeatured : ''}`}
                  >
                    {plan.code === 'ANNUAL' && <span className={styles.planBadge}>2 mois offerts</span>}
                    <div>
                      <div className={styles.planName}>{plan.label || planCodeLabel(plan.code)}</div>
                      <div className={styles.planSub}>
                        Validité {plan.durationDays ?? 0} jours
                      </div>
                    </div>
                    <div className={styles.planPrice}>{formatGnf(plan.priceGnf ?? 0)}</div>
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
            {protection.isLoading ? (
              <SkeletonRows rows={4} height={20} />
            ) : protection.isError || !protection.data ? (
              <ErrorState error={protection.error} onRetry={() => protection.refetch()} />
            ) : (
              <dl className={styles.drmList}>
                <div className={styles.drmRow}>
                  <dt>Chiffrement</dt>
                  <dd>{protection.data.scheme ?? '—'}</dd>
                </div>
                <div className={styles.drmRow}>
                  <dt>Rotation des clés</dt>
                  <dd>{protection.data.keyRotation ?? '—'}</dd>
                </div>
                <div className={styles.drmRow}>
                  <dt>Validité Premium</dt>
                  <dd>{protection.data.premiumValidityDays ?? '—'} jours</dd>
                </div>
                <div className={styles.drmRow}>
                  <dt>Appareils max. par compte</dt>
                  <dd>{protection.data.maxDevicesPerAccount ?? '—'}</dd>
                </div>
              </dl>
            )}
          </Card>

          {/* Comptes administrateurs */}
          <Card>
            <div className={styles.cardHead}>
              <CardTitle>Comptes administrateurs</CardTitle>
              {canInvite && (
                <Button variant="secondary" className={styles.smallBtn} onClick={() => setInviting(true)}>
                  Inviter
                </Button>
              )}
            </div>
            <div className={styles.admins}>
              {admins.isLoading ? (
                <SkeletonRows rows={3} height={32} />
              ) : admins.isError || !admins.data ? (
                <ErrorState error={admins.error} onRetry={() => admins.refetch()} />
              ) : (
                admins.data.map((admin) => (
                  <div key={admin.id} className={styles.admin}>
                    <Avatar initials={initials(admin.name, admin.email ?? '')} size={32} variant="soft" />
                    <div className={styles.adminInfo}>
                      <div className={styles.adminName}>{admin.name}</div>
                      <div className={styles.adminEmail}>{admin.email}</div>
                    </div>
                    {admin.role && <RoleBadge role={admin.role} />}
                    {canRemoveAdmin && (
                      <button
                        className={styles.removeAdmin}
                        aria-label="Retirer"
                        onClick={() => admin.id && setAdminToDelete(admin.id)}
                      >
                        <Icon name="close" size={15} strokeWidth={2.2} />
                      </button>
                    )}
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
                <div className={styles.themeSub}>S'applique à ce back-office uniquement</div>
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

      {/* Modale édition des tarifs */}
      <Modal open={editingPlans !== null} title="Modifier les tarifs" onClose={() => setEditingPlans(null)}>
        <div className={styles.modalBody}>
          {editingPlans?.map((plan, idx) => (
            <TextField
              key={plan.code}
              label={`${plan.label || planCodeLabel(plan.code)} — prix (GNF)`}
              type="number"
              value={plan.priceGnf ?? 0}
              onChange={(e) =>
                setEditingPlans((prev) =>
                  prev
                    ? prev.map((p, i) => (i === idx ? { ...p, priceGnf: Number(e.target.value) } : p))
                    : prev,
                )
              }
            />
          ))}
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setEditingPlans(null)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={savePlans} disabled={updatePlans.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modale invitation admin */}
      <Modal open={inviting} title="Inviter un administrateur" onClose={() => setInviting(false)}>
        <div className={styles.modalBody}>
          <TextField
            label="Adresse e-mail"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="prenom.nom@mohamedcherif.app"
          />
          <SelectField
            label="Rôle"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as AdminRole)}
            options={[
              { value: 'EDITOR', label: adminRoleLabel('EDITOR') },
              { value: 'SUPER_ADMIN', label: adminRoleLabel('SUPER_ADMIN') },
            ]}
          />
          <div className={styles.modalActions}>
            <Button variant="secondary" onClick={() => setInviting(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={sendInvite} disabled={invite.isPending}>
              Inviter
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={adminToDelete !== null}
        title="Retirer cet administrateur ?"
        description="Il perdra immédiatement l'accès au back-office."
        confirmLabel="Retirer"
        danger
        onConfirm={confirmDeleteAdmin}
        onCancel={() => setAdminToDelete(null)}
      />
    </>
  )
}
