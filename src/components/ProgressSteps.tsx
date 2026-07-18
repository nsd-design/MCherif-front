import styles from './ProgressSteps.module.css'
import { Icon } from './Icon'
import type { EncodingStep } from '../types'

const STEPS: { key: EncodingStep; label: string }[] = [
  { key: 'uploaded', label: 'Téléversé' },
  { key: 'transcoding', label: 'Transcodage' },
  { key: 'encryption', label: 'Chiffrement' },
  { key: 'ready', label: 'Prêt' },
]

type StepState = 'done' | 'current' | 'pending'

function stateFor(step: EncodingStep, current: EncodingStep): StepState {
  const order = STEPS.map((s) => s.key)
  const stepIdx = order.indexOf(step)
  const curIdx = order.indexOf(current)
  if (stepIdx < curIdx) return 'done'
  if (stepIdx === curIdx) return 'current'
  return 'pending'
}

/** Fil des étapes d'encodage/chiffrement (Téléversé → … → Prêt). */
export function ProgressSteps({ current }: { current: EncodingStep }) {
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
