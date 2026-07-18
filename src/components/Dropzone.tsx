import { useRef, useState, type DragEvent } from 'react'
import styles from './Dropzone.module.css'
import { Icon } from './Icon'

interface DropzoneProps {
  onFile?: (file: File) => void
  accept?: string
  hint?: string
}

/** Zone de dépôt drag & drop d'un fichier audio. */
export function Dropzone({
  onFile,
  accept = 'audio/*',
  hint = 'MP3, WAV, M4A · 500 Mo max',
}: DropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile?.(file)
  }

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
      }}
    >
      <span className={styles.icon}>
        <Icon name="upload" size={20} strokeWidth={2.2} />
      </span>
      <div className={styles.title}>Glissez le fichier audio ici</div>
      <div className={styles.hint}>
        ou <span className={styles.browse}>parcourir</span> — {hint}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className={styles.input}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile?.(file)
        }}
      />
    </div>
  )
}
