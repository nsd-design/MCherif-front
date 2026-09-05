import styles from './ProgressSteps.module.css'
import { Icon } from './Icon'
import type { EncodingState } from '../api/types'

// Étapes affichées (FAILED est géré à part par l'appelant).
const STEPS: { key: Exclude<EncodingState, 'FAILED'>; label: string }[] = [
  { key: 'UPLOADED', label: 'Téléversé' },
  { key: 'TRANSCODING', label: 'Transcodage' },
  { key: 'ENCRYPTING', label: 'Chiffrement' },
  { key: 'READY', label: 'Prêt' },
]

type StepState = 'done' | 'current' | 'pending'

function stateFor(step: EncodingState, current: EncodingState): StepState {
  const order = STEPS.map((s) => s.key as EncodingState)
  const stepIdx = order.indexOf(step)
  const curIdx = order.indexOf(current)
  if (current === 'READY') return 'done'
  if (stepIdx < curIdx) return 'done'
  if (stepIdx === curIdx) return 'current'
  return 'pending'
}

/** Fil des étapes d'encodage/chiffrement (Téléversé → … → Prêt). */
export function ProgressSteps({ current }: { current: EncodingState }) {
  return (
    <div className={styles.steps}>
      {STEPS.map((step) => {
        const state = stateFor(step.key, current)
        return (
          <div key={step.key} className={styles.step}>
            <span className={`${styles.dot} ${styles[state]}`}>
              {state === 'done' && <Icon name="check" size={11} strokeWidth={3.2} />}
            </span>
            <span className={`${styles.label} ${styles[`${state}Label`]}`}>{step.label}</span>
          </div>
        )
      })}
    </div>
  )
}
