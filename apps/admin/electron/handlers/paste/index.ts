import { registerPasteText } from '@weesper/ipc'
import type { IpcMain } from 'electron'
import { pasteHandler } from './pasteHandler'

export const handler = (ipcMain: IpcMain) => {
  registerPasteText(ipcMain, pasteHandler)
}
