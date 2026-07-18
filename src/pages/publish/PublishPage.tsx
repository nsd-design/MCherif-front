import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import type { AccessTier, EncodingStep } from '../../types'

const schema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  theme: z.string().min(1),
  language: z.string().min(1),
  recordedAt: z.string().min(1, 'La date est requise'),
  description: z.string().max(500, '500 caractères maximum').optional(),
})

type FormValues = z.infer<typeof schema>

const STEP_ORDER: EncodingStep[] = ['uploaded', 'transcoding', 'encryption', 'ready']
const STEP_LABEL: Record<EncodingStep, string> = {
  uploaded: 'Téléversement…',
  transcoding: 'Transcodage audio…',
  encryption: 'Chiffrement DRM en cours…',
  ready: 'Prêt à publier',
}

interface Upload {
  name: string
  sizeLabel: string
  progress: number
  step: EncodingStep
}

export function PublishPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: 'La patience et la foi',
      theme: 'Foi',
      language: 'Français',
      recordedAt: '2026-07-11',
      description:
        'Prêche du vendredi sur la patience face aux épreuves et la constance dans la foi.',
    },
  })

  const [access, setAccess] = useState<AccessTier>('premium')
  const [notify, setNotify] = useState(true)
  const [upload, setUpload] = useState<Upload>({
    name: 'preche-2026-07-11.wav',
    sizeLabel: '412 Mo · 58 min',
    progress: 64,
    step: 'encryption',
  })

  // Simulation de progression d'encodage/chiffrement.
  useEffect(() => {
    if (upload.progress >= 100) return
    const timer = setInterval(() => {
      setUpload((prev) => {
        if (prev.progress >= 100) return prev
        const next = Math.min(100, prev.progress + 2)
        const stepIdx = Math.min(
          STEP_ORDER.length - 1,
          Math.floor((next / 100) * STEP_ORDER.length),
        )
        return { ...prev, progress: next, step: STEP_ORDER[stepIdx] }
      })
    }, 900)
    return () => clearInterval(timer)
  }, [upload.progress])

  function onFile(file: File) {
    setUpload({
      name: file.name,
      sizeLabel: `${Math.round(file.size / (1024 * 1024))} Mo`,
      progress: 4,
      step: 'uploaded',
    })
  }

  const badgeStatus = upload.step === 'ready' ? 'published' : 'encoding'

  return (
    <>
      <TopBar
        title="Nouveau prêche"
        showAvatar={false}
        actions={
          <>
            <Button variant="secondary">Enregistrer en brouillon</Button>
            <Button variant="primary" onClick={handleSubmit(() => undefined)}>
              Publier
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
                <Dropzone onFile={onFile} />
              </div>

              <div className={styles.fileCard}>
                <div className={styles.fileHead}>
                  <span className={styles.fileIcon}>
                    <Icon name="audio" size={16} />
                  </span>
                  <div className={styles.fileInfo}>
                    <div className={styles.fileName}>{upload.name}</div>
                    <div className={styles.fileMeta}>{upload.sizeLabel}</div>
                  </div>
                  <PrayerStatusBadge status={badgeStatus} />
                </div>

                <div className={styles.steps}>
                  <ProgressSteps current={upload.step} />
                </div>

                <ProgressBar value={upload.progress} />
                <div className={styles.progressMeta}>
                  <span>{STEP_LABEL[upload.step]}</span>
                  <span className={styles.progressPct}>{upload.progress} %</span>
                </div>
              </div>
            </Card>

            <Card className={styles.accessCard}>
              <div className={styles.optionRow}>
                <div>
                  <div className={styles.optionTitle}>Accès</div>
                  <div className={styles.optionSub}>
                    Les prêches Premium nécessitent un abonnement actif
                  </div>
                </div>
                <SegmentedControl<AccessTier>
                  ariaLabel="Accès"
                  value={access}
                  onChange={setAccess}
                  segments={[
                    { value: 'free', label: 'Gratuit' },
                    { value: 'premium', label: 'Premium' },
                  ]}
                />
              </div>
              <div className={`${styles.optionRow} ${styles.optionBorder}`}>
                <div>
                  <div className={styles.optionTitle}>
                    Notifier les utilisateurs à la publication
                  </div>
                  <div className={styles.optionSub}>
                    Notification push envoyée à tous les appareils
                  </div>
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
            <TextField
              label="Date d'enregistrement"
              type="date"
              error={errors.recordedAt?.message}
              {...register('recordedAt')}
            />
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
