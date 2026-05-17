import { registerListLanguages } from '@open-bisbis/ipc'
import type { IpcMain } from 'electron'
import { languages } from './config'

export const handler = (ipcMain: IpcMain) => {
  registerListLanguages(ipcMain, async () => {
    return Object.entries(languages).map(([code, language]) => ({
      code,
      language,
    }))
  })
}
