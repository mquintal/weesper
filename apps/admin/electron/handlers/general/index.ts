import { registerGetAppInfo } from '@open-bisbis/ipc'
import { app, type IpcMain } from 'electron'

export const handler = (ipcMain: IpcMain) => {
  registerGetAppInfo(ipcMain, () => {
    return {
      version: app.getVersion(),
      osVersion: process.getSystemVersion(),
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
    }
  })
}
