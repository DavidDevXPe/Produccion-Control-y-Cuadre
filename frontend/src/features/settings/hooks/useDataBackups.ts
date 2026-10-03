import { ChangeEvent, DragEvent, useState } from 'react'
import { readStorageQuarantine } from '../../../storage/storageQuarantine'
import {
  createTrabundaBackup,
  downloadJsonFile,
  parseTrabundaBackup,
  restoreTrabundaBackup,
  type TrabundaBackupPreview,
} from '../backup/backupService'

export function backupFilename(prefix = 'trabunda-backup') {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.json`
}

export function useDataBackups() {
  const [quarantine] = useState(() => readStorageQuarantine())
  const [preview, setPreview] = useState<TrabundaBackupPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  const usedBytes = Object.keys(localStorage).reduce((acc, key) => {
    return acc + (localStorage.getItem(key)?.length || 0) * 2
  }, 0)
  const maxEstimatedBytes = 5 * 1024 * 1024 // 5 MB
  const usagePercentage = Math.min(100, Math.round((usedBytes / maxEstimatedBytes) * 100))
  const usedKb = (usedBytes / 1024).toFixed(1)

  const exportBackup = () => {
    downloadJsonFile(backupFilename(), createTrabundaBackup())
  }

  const exportQuarantine = () => {
    downloadJsonFile(backupFilename('trabunda-datos-apartados'), quarantine)
  }

  const processBackupFile = async (file: File) => {
    setPreview(null)
    setError(null)
    try {
      setPreview(parseTrabundaBackup(await file.text()))
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'No se pudo leer el respaldo seleccionado.',
      )
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await processBackupFile(file)
      event.target.value = ''
    }
  }

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      await processBackupFile(file)
    }
  }

  const confirmResetData = () => {
    downloadJsonFile(backupFilename('trabunda-respaldo-autoguardado'), createTrabundaBackup())
    localStorage.clear()
    window.location.reload()
  }

  const confirmRestore = () => {
    if (!preview) return
    downloadJsonFile(backupFilename('trabunda-preimportacion'), createTrabundaBackup())
    restoreTrabundaBackup(preview)
    window.location.reload()
  }

  return {
    quarantine,
    preview,
    error,
    isDragging,
    showResetModal,
    setShowResetModal,
    usedKb,
    usagePercentage,
    exportBackup,
    exportQuarantine,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    confirmResetData,
    confirmRestore,
  }
}
