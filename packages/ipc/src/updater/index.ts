export type { UpdateProgress, UpdateStatus } from './updater'

export {
  checkForUpdate,
  downloadUpdate,
  installUpdate,
  listenForUpdateProgress,
  listenForUpdateStatus,
  registerCheckForUpdate,
  registerDownloadUpdate,
  registerInstallUpdate,
  sendDownloadProgress,
  sendStatus,
} from './updater'
