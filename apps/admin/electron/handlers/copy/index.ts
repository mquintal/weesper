import { registerCopyText } from '@weesper/ipc'
import { clipboard, type IpcMain } from 'electron'

export const handler = (ipcMain: IpcMain) => {
  registerCopyText(ipcMain, async (text: string) => {
    clipboard.writeText(text)
  })
}
