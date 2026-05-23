import type { IpcRenderer } from 'electron'

declare global {
  interface Window {
    ipcRenderer: IpcRenderer
  }
}

export { useAppInfo } from './app'
export { useLanguages } from './languages'
export { useCancelDownloadLlm, useDeleteLlm, useDownloadLlm, useLlms, useSelectLlm } from './llms'
export { useMicSettings } from './mic'
export {
  useCancelDownloadModel,
  useDeleteModel,
  useDownloadModel,
  useModels,
  useSelectModel,
} from './models'
export { useAccessibilityGrant, useMicGrant, useOnboarding } from './onboarding'

export { useTranscribe } from './recording'
export { useDeleteRecording, useRecording, useRecordings } from './recordings'
export {
  useCreateShortcut,
  useDefaultShortcut,
  useDeleteShortcut,
  useSetDefaultShortcut,
  useShortcuts,
  useUpdateShortcut,
} from './shortcuts'

export { useCheckForUpdate, useDownloadUpdate, useInstallUpdate, useUpdateProgress, useUpdateStatus } from './updater'
