import { registerCheckForUpdate, registerDownloadUpdate, registerInstallUpdate } from '@weesper/ipc'
import type { IpcMain } from 'electron'
import { checkForUpdates, downloadUpdate, installUpdate } from '../../services/auto-updater'

export const handler = (ipcMain: IpcMain) => {
  registerCheckForUpdate(ipcMain, async () => {
    return (await checkForUpdates())?.isUpdateAvailable ?? false
  })

  registerDownloadUpdate(ipcMain, async () => {
    await downloadUpdate()
  })

  registerInstallUpdate(ipcMain, () => {
    installUpdate()
  })
}
