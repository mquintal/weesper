import type { IpcMainInvokeEvent } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelDownloadModel,
  deleteModel,
  downloadModel,
  getListModels,
  registerCancelDownloadModel,
  registerDeleteModel,
  registerDownloadModel,
  registerListModels,
  registerSelectModel,
  selectModel,
  TOPICS,
} from './models'

describe('Models IPC module', () => {
  let mockIpcMain: any
  let mockIpcRenderer: any

  beforeEach(() => {
    mockIpcMain = {
      handle: vi.fn(),
    }

    mockIpcRenderer = {
      invoke: vi.fn(),
    }
  })

  describe('Main Process handlers', () => {
    it('registerListModels registers topic and returns success for valid data', async () => {
      const mockData = [
        {
          id: 'test-model',
          type: 'whisper',
          url: 'http://example.com/model.bin',
          name: 'Test Model',
          size: 1024,
          accuracy: 8,
          speed: 5,
          path: '/path/to/model.bin',
          hash: 'abc123hash',
        },
      ]
      const mockHandler = vi.fn().mockResolvedValue(mockData)
      registerListModels(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.LIST, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toEqual(mockData)
    })

    it('registerDownloadModel registers topic and handles valid id', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined)
      registerDownloadModel(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.DOWNLOAD, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const event = {} as IpcMainInvokeEvent
      const result = await callback(event, 'model-id')

      expect(result.status).toBe('success')
      expect(mockHandler).toHaveBeenCalledWith(event, 'model-id')
    })

    it('registerCancelDownloadModel handles cancelation', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerCancelDownloadModel(mockIpcMain, mockHandler)
      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.CANCEL_DOWNLOAD, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'model-id')

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('model-id')
    })

    it('registerDeleteModel handles deletion', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerDeleteModel(mockIpcMain, mockHandler)
      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.DELETE, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'model-id')

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('model-id')
    })

    it('registerSelectModel handles selection with language', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerSelectModel(mockIpcMain, mockHandler)
      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.SELECT, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'model-id', 'en')

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('model-id', 'en')
    })
  })

  describe('Renderer Process callers', () => {
    it('getListModels invokes topic and parses successful result', async () => {
      const mockData = [
        {
          id: 'test-model',
          type: 'whisper',
          url: 'http://example.com/model.bin',
          name: 'Test Model',
          size: 1024,
          accuracy: 8,
          speed: 5,
          path: '/path/to/model.bin',
          hash: 'abc123hash',
        },
      ]
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: mockData })

      const result = await getListModels(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.LIST)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toEqual(mockData)
      }
    })

    it('downloadModel invokes topic with id', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: undefined })

      const result = await downloadModel(mockIpcRenderer, 'model-id')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.DOWNLOAD, 'model-id')
      expect(result.status).toBe('success')
    })

    it('cancelDownloadModel invokes topic with id', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await cancelDownloadModel(mockIpcRenderer, 'model-id')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.CANCEL_DOWNLOAD, 'model-id')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })

    it('deleteModel invokes topic with id', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await deleteModel(mockIpcRenderer, 'model-id')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.DELETE, 'model-id')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })

    it('selectModel invokes topic with id and language', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await selectModel(mockIpcRenderer, 'model-id', 'en')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.SELECT, 'model-id', 'en')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })
  })
})
