import * as storage from '@weesper/config'
import {
  registerCancelDownloadModel,
  registerDeleteModel,
  registerDownloadModel,
  registerListModels,
  registerSelectModel,
} from '@weesper/ipc'
import type { IpcMain } from 'electron'
import { models } from '../../config'
import { createHandlers, type StorageAdapter } from '../downloadable-asset'

const modelStorage: StorageAdapter = {
  getDownloadedHash: storage.getDownloadedModelHash,
  setDownloadedHash: storage.setDownloadedModelHash,
  removeDownloadedHash: storage.removeDownloadedModelHash,
  getSelectedId: () => storage.getSelectedModel()?.id,
  setSelected: (id, language) => storage.setSelectedModel(id, language as string),
}

export const handler = (ipcMain: IpcMain, onSelect?: (item: any) => Promise<void> | void) => {
  const h = createHandlers({
    items: models,
    storage: modelStorage,
    onSelect,
  })

  registerDownloadModel(ipcMain, h.download)
  registerCancelDownloadModel(ipcMain, h.cancelDownload)
  registerDeleteModel(ipcMain, h.delete)
  registerListModels(ipcMain, h.list)
  registerSelectModel(ipcMain, h.select)
}

export const getSelectedModel = () => {
  const selectedModel = storage.getSelectedModel()
  if (selectedModel) {
    const model = models.find((model) => model.id === selectedModel.id)
    if (model) {
      return { ...model, language: selectedModel.language }
    }
  }
}
