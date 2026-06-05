import fs from 'node:fs'
import { updateDownloadProgress } from '@weesper/ipc'
import type { IpcMainInvokeEvent } from 'electron'
import { DownloadState, download } from '../../utils/download'
import { calculateFileHash } from '../../utils/hash'
import { activeDownloads } from './active-downloads'

export type AssetItem = {
  id: string
  url: string
  path: string
  hash: string
  size: number
  [key: string]: any
}

export type StorageAdapter = {
  getDownloadedHash: (id: string) => string
  setDownloadedHash: (id: string, hash: string) => void
  removeDownloadedHash: (id: string) => void
  getSelectedId: () => string | undefined
  setSelected: (id: string, ...args: any[]) => void
}

export type AssetHandlerOptions<T extends AssetItem> = {
  items: T[]
  storage: StorageAdapter
  onSelect?: (item: T) => Promise<void> | void
}

export const createHandlers = <T extends AssetItem>(options: AssetHandlerOptions<T>) => {
  const { items, storage, onSelect } = options

  const list = async () => {
    const selectedId = storage.getSelectedId()

    return await Promise.all(
      items.map(async (item) => {
        let isDownloaded = false
        if (fs.existsSync(item.path)) {
          const hash = storage.getDownloadedHash(item.id)
          isDownloaded = hash === item.hash
        }
        return {
          ...item,
          isDownloaded,
          isSelected: item.id === selectedId && isDownloaded,
        }
      }),
    )
  }

  const downloadHandler = async (event: IpcMainInvokeEvent, itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) {
      throw new Error(`Item ${itemId} not found`)
    }
    if (!item.url) {
      throw new Error(`Item ${itemId} has no url`)
    }

    // Check if file already exists and matches the hash
    if (fs.existsSync(item.path)) {
      try {
        const hash = await calculateFileHash(item.path)
        if (hash === item.hash) {
          console.log(`Item ${itemId} already exists with matching hash. Skipping download.`)
          storage.setDownloadedHash(itemId, hash)
          updateDownloadProgress(event, { id: itemId, state: DownloadState.Finished, percentage: 100 } as any)
          return
        }
      } catch (error) {
        console.warn(`Failed to check existing hash for ${itemId}, proceeding with download:`, error)
      }
    }

    let previousState = { state: DownloadState.Progress, percentage: 0 }

    const cancel = download(item.url, item.path, item.size, async (state) => {
      if (state.state === DownloadState.Finished || state.state === DownloadState.Error) {
        activeDownloads.delete(itemId)
        if (state.state === DownloadState.Error) {
          fs.unlink(item.path, () => {})
        }

        if (state.state === DownloadState.Finished) {
          try {
            const hash = await calculateFileHash(item.path)
            storage.setDownloadedHash(itemId, hash)
          } catch (error) {
            console.error(`Failed to calculate hash for ${itemId}:`, error)
          }
        }
      }

      if (previousState.percentage !== state.percentage || previousState.state !== state.state) {
        updateDownloadProgress(event, { ...state, id: itemId })
        previousState = state
      }
    })

    activeDownloads.set(itemId, cancel)
  }

  const cancelDownload = async (itemId: string) => {
    const cancel = activeDownloads.get(itemId)
    if (cancel) {
      cancel()
      activeDownloads.delete(itemId)

      // Delete the file if it exists
      const item = items.find((i) => i.id === itemId)
      if (item) {
        fs.unlink(item.path, () => {})
      }
      return true
    }
    return false
  }

  const deleteHandler = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) {
      throw new Error(`Item ${itemId} not found`)
    }

    if (storage.getSelectedId() === itemId) {
      throw new Error(`Item ${itemId} is selected and cannot be deleted`)
    }

    try {
      if (fs.existsSync(item.path)) {
        await fs.promises.unlink(item.path)
      }

      storage.removeDownloadedHash(itemId)
      return true
    } catch (error) {
      console.error(`Failed to delete item ${itemId}:`, error)
      return false
    }
  }

  const select = async (itemId: string, ...args: any[]) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) {
      throw new Error(`Item ${itemId} not found`)
    }

    try {
      const hash = storage.getDownloadedHash(itemId)

      if (hash === item.hash) {
        storage.setSelected(itemId, ...args)
        await onSelect?.(item)
        return true
      }
      return false
    } catch (_error) {
      return false
    }
  }

  return {
    list,
    download: downloadHandler,
    cancelDownload,
    delete: deleteHandler,
    select,
  }
}
