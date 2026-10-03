import { BackupHeader } from '../components/BackupHeader'
import { BackupImportDropzone } from '../components/BackupImportDropzone'
import { BackupQuarantineSection } from '../components/BackupQuarantineSection'
import { BackupResetModal } from '../components/BackupResetModal'
import { BackupStorageCard } from '../components/BackupStorageCard'
import { useDataBackups } from '../hooks/useDataBackups'

export function DataBackupsPage() {
  const {
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
  } = useDataBackups()

  return (
    <div className="mx-auto max-w-[88rem] space-y-6">
      <BackupHeader
        onShowResetModal={() => setShowResetModal(true)}
        onExportBackup={exportBackup}
      />

      <BackupStorageCard
        usedKb={usedKb}
        usagePercentage={usagePercentage}
      />

      <BackupQuarantineSection
        quarantine={quarantine}
        onExportQuarantine={exportQuarantine}
      />

      <BackupImportDropzone
        isDragging={isDragging}
        error={error}
        preview={preview}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileChange={handleFileChange}
        onConfirmRestore={confirmRestore}
      />

      <BackupResetModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirmReset={confirmResetData}
      />
    </div>
  )
}
