import * as storage from '@open-bisbis/config'
import {
  registerCancelDownloadLlm,
  registerDeleteLlm,
  registerDownloadLlm,
  registerListLlms,
  registerSelectLlm,
} from '@open-bisbis/ipc'
import type { IpcMain } from 'electron'
import { llms } from '../../config'
import { createHandlers, type StorageAdapter } from '../downloadable-asset'

const llmStorage: StorageAdapter = {
  getDownloadedHash: storage.getDownloadedLlmHash,
  setDownloadedHash: storage.setDownloadedLlmHash,
  removeDownloadedHash: storage.removeDownloadedLlmHash,
  getSelectedId: () => storage.getSelectedLlm(),
  setSelected: (id) => storage.setSelectedLlm(id),
}

export const handler = (ipcMain: IpcMain, onSelect?: (item: any) => Promise<void> | void) => {
  const h = createHandlers({
    items: llms,
    storage: llmStorage,
    onSelect,
  })

  registerDownloadLlm(ipcMain, h.download)
  registerCancelDownloadLlm(ipcMain, h.cancelDownload)
  registerDeleteLlm(ipcMain, h.delete)
  registerListLlms(ipcMain, h.list)
  registerSelectLlm(ipcMain, h.select)
}

export const getSelectedLlm = () => {
  const selectedLlmId = storage.getSelectedLlm()
  if (selectedLlmId) {
    return llms.find((llm) => llm.id === selectedLlmId)
  }
}
