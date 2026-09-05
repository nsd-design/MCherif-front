import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import styles from './PublishPage.module.css'
import { TopBar } from '../../components/TopBar'
import { PageBody } from '../../components/PageBody'
import { Card, CardTitle } from '../../components/Card'
import { Button } from '../../components/Button'
import { TextField } from '../../components/TextField'
import { TextareaField } from '../../components/TextareaField'
import { SelectField } from '../../components/SelectField'
import { Dropzone } from '../../components/Dropzone'
import { ProgressSteps } from '../../components/ProgressSteps'
import { ProgressBar } from '../../components/ProgressBar'
import { SegmentedControl } from '../../components/SegmentedControl'
import { Toggle } from '../../components/Toggle'
import { Icon } from '../../components/Icon'
import { PrayerStatusBadge } from '../../components/StatusBadge'
import {
  createPrayer,
  prayerKeys,
  publishPrayerById,
  setPrayerAccess,
  uploadAudioFile,
  useEncodingStatus,
} from '../../api/prayers'
import { dashboardKeys } from '../../api/dashboard'
import { toast } from '../../store/toast'
import { errorMessage, errorMessageFor } from '../../i18n/errors'
import type { PrayerAccess } from '../../api/types'

const schema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  theme: z.string().max(120).optional(),
  language: z.string().max(30).optional(),
  recordedOn: z.string().optional(),
  description: z.string().max(500, '500 caractères maximum').optional(),
})

type FormValues = z.infer<typeof schema>

const STATE_LABEL = {
  UPLOADED: 'Téléversement terminé',
  TRANSCODING: 'Transcodage audio…',
  ENCRYPTING: 'Chiffrement DRM en cours…',
  READY: 'Prêt à publier',
  FAILED: 'Échec de l’encodage',
} as const

export function PublishPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', theme: 'Foi', language: 'Français', recordedOn: '', description: '' },
  })

  const [prayerId, setPrayerId] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [access, setAccess] = useState<PrayerAccess>('PREMIUM')
  const [notify, setNotify] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const encoding = useEncodingStatus(prayerId ?? '', Boolean(prayerId))
  const state = encoding.data?.state ?? 'UPLOADED'
  const progress = encoding.data?.progress ?? 0
  const isReady = state === 'READY'

  /** Crée le brouillon si nécessaire et renvoie son id. */
  async function ensureDraft(): Promise<string | null> {
    if (prayerId) return prayerId
    const values = getValues()
    if (!values.title.trim()) {
      toast.error('Renseignez le titre avant de téléverser.')
      return null
    }
    try {
      const created = await createPrayer({
        title: values.title,
        theme: values.theme || undefined,
        language: values.language || undefined,
        recordedOn: values.recordedOn || undefined,
        description: values.description || undefined,
        access,
      })
      const id = created.id ?? null
      setPrayerId(id)
      return id
    } catch (e) {
      toast.error(errorMessage(e))
      return null
    }
  }

  async function handleFile(file: File) {
    const id = await ensureDraft()
    if (!id) return
    setFileName(file.name)
    setUploading(true)
    try {
      await uploadAudioFile(id, file)
      // Un job d'encodage vient d'apparaître : relance le sondage du tableau de
      // bord, qui s'arrête de lui-même quand il n'y a rien à surveiller.
      qc.invalidateQueries({ queryKey: dashboardKeys.all })
      toast.success('Fichier téléversé. Encodage en cours…')
    } catch (e) {
      toast.error(
        errorMessageFor(e, {
          unprocessable: 'Fichier invalide (type ou taille). Formats : MP3, WAV, M4A · 500 Mo max.',
        }),
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveDraft() {
    const id = await ensureDraft()
    if (id) toast.success('Brouillon enregistré.')
  }

  async function onPublish() {
    const id = await ensureDraft()
    if (!id) return
    if (!isReady) {
      toast.error('Attendez la fin de l’encodage avant de publier.')
      return
    }
    setPublishing(true)
    try {
      await setPrayerAccess(id, access)
      await publishPrayerById(id, notify)
      qc.invalidateQueries({ queryKey: prayerKeys.all })
      qc.invalidateQueries({ queryKey: dashboardKeys.all })
      toast.success('Prêche publié.')
      navigate(`/preches/${id}`)
    } catch (e) {
      toast.error(
        errorMessageFor(e, {
          unprocessable: 'Publication impossible : le média chiffré n’est pas prêt.',
        }),
      )
    } finally {
      setPublishing(false)
    }
  }

  return (
    <>
      <TopBar
        title="Nouveau prêche"
        showAvatar={false}
        actions={
          <>
            <Button variant="secondary" onClick={handleSaveDraft}>
              Enregistrer en brouillon
            </Button>
            <Button variant="primary" onClick={handleSubmit(onPublish)} disabled={publishing}>
              {publishing ? 'Publication…' : 'Publier'}
            </Button>
          </>
        }
      />
      <PageBody tight>
        <div className={styles.columns}>
          <div className={styles.left}>
            <Card>
              <CardTitle>Fichier audio</CardTitle>
              <div className={styles.dz}>
                <Dropzone onFile={handleFile} />
              </div>

              {fileName && (
                <div className={styles.fileCard}>
                  <div className={styles.fileHead}>
                    <span className={styles.fileIcon}>
                      <Icon name="audio" size={16} />
                    </span>
                    <div className={styles.fileInfo}>
                      <div className={styles.fileName}>{fileName}</div>
                      <div className={styles.fileMeta}>
                        {uploading ? 'Téléversement…' : STATE_LABEL[state]}
                      </div>
                    </div>
                    <PrayerStatusBadge status={isReady ? 'PUBLISHED' : state === 'FAILED' ? 'FAILED' : 'ENCODING'} />
                  </div>

                  <div className={styles.steps}>
                    <ProgressSteps current={state} />
                  </div>

                  <ProgressBar value={isReady ? 100 : progress} />
                  <div className={styles.progressMeta}>
                    <span>{STATE_LABEL[state]}</span>
                    <span className={styles.progressPct}>{isReady ? 100 : progress} %</span>
                  </div>
                </div>
              )}
            </Card>

            <Card className={styles.accessCard}>
              <div className={styles.optionRow}>
                <div>
                  <div className={styles.optionTitle}>Accès</div>
                  <div className={styles.optionSub}>
                    Les prêches Premium nécessitent un abonnement actif
                  </div>
                </div>
                <SegmentedControl<PrayerAccess>
                  ariaLabel="Accès"
                  value={access}
                  onChange={setAccess}
                  segments={[
                    { value: 'FREE', label: 'Gratuit' },
                    { value: 'PREMIUM', label: 'Premium' },
                  ]}
                />
              </div>
              <div className={`${styles.optionRow} ${styles.optionBorder}`}>
                <div>
                  <div className={styles.optionTitle}>Notifier les utilisateurs à la publication</div>
                  <div className={styles.optionSub}>Notification push envoyée à tous les appareils</div>
                </div>
                <Toggle checked={notify} onChange={setNotify} label="Notifier" />
              </div>
            </Card>
          </div>

          <Card className={styles.infoCard}>
            <CardTitle>Informations</CardTitle>
            <TextField label="Titre" error={errors.title?.message} {...register('title')} />
            <div className={styles.pair}>
              <SelectField
                label="Thème"
                options={[
                  { value: 'Foi', label: 'Foi' },
                  { value: 'Ramadan', label: 'Ramadan' },
                  { value: 'Famille', label: 'Famille' },
                  { value: 'Zakat', label: 'Zakat' },
                  { value: 'Aïd', label: 'Aïd' },
                ]}
                {...register('theme')}
              />
              <SelectField
                label="Langue"
                options={[
                  { value: 'Français', label: 'Français' },
                  { value: 'Soussou', label: 'Soussou' },
                  { value: 'Peul', label: 'Peul' },
                ]}
                {...register('language')}
              />
            </div>
            <TextField label="Date d'enregistrement" type="date" {...register('recordedOn')} />
            <TextareaField
              label="Description courte"
              error={errors.description?.message}
              {...register('description')}
            />
            <div>
              <div className={styles.coverLabel}>Pochette</div>
              <div className={styles.coverCard}>
                <img src="/cheick.jpeg" alt="" className={styles.coverImg} />
                <div className={styles.coverInfo}>
                  <div className={styles.coverTitle}>Photo par défaut</div>
                  <div className={styles.coverSub}>Portrait du Cheick</div>
                </div>
                <Button variant="secondary">Changer</Button>
              </div>
            </div>
          </Card>
        </div>
      </PageBody>
    </>
  )
}
