import type { IpcMainInvokeEvent } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelDownloadLlm,
  deleteLlm,
  downloadLlm,
  getListLlms,
  registerCancelDownloadLlm,
  registerDeleteLlm,
  registerDownloadLlm,
  registerListLlms,
  registerSelectLlm,
  selectLlm,
  TOPICS,
} from './llms'

describe('llms', () => {
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

  describe('IpcMain handlers', () => {
    it('registerListLlms registers topic and returns success for valid data', async () => {
      const mockData = [
        {
          id: 'test-llm',
          type: 'llama',
          url: 'http://example.com/llm.bin',
          name: 'Test LLM',
          size: 1024,
          accuracy: 8,
          speed: 5,
          path: '/path/to/llm.bin',
          hash: 'abc123hash',
        },
      ]
      const mockHandler = vi.fn().mockResolvedValue(mockData)
      registerListLlms(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.LIST, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toEqual(mockData)
    })

    it('registerListLlms returns error for invalid data', async () => {
      const mockData = [{ id: 'test-llm' }] // Missing required fields
      const mockHandler = vi.fn().mockResolvedValue(mockData)
      registerListLlms(mockIpcMain, mockHandler)

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('error')
      expect(result.data).toBeDefined()
    })

    it('registerDownloadLlm registers topic and handles valid id', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined)
      registerDownloadLlm(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.DOWNLOAD, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const event = {} as IpcMainInvokeEvent
      const result = await callback(event, 'model-id')

      expect(result.status).toBe('success')
      expect(mockHandler).toHaveBeenCalledWith(event, 'model-id')
    })

    it('registerDownloadLlm returns error for invalid id type', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined)
      registerDownloadLlm(mockIpcMain, mockHandler)

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 123) // Should be string

      expect(result.status).toBe('error')
      expect(mockHandler).not.toHaveBeenCalled()
    })

    it('registerCancelDownloadLlm handles cancelation', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerCancelDownloadLlm(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.CANCEL_DOWNLOAD, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'model-id')

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('model-id')
    })

    it('registerDeleteLlm handles deletion', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerDeleteLlm(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.DELETE, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'model-id')

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('model-id')
    })

    it('registerSelectLlm handles selection', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerSelectLlm(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.SELECT, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'model-id')

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('model-id')
    })
  })

  describe('IpcRenderer callers', () => {
    it('getListLlms invokes topic and parses successful result', async () => {
      const mockData = [
        {
          id: 'test-llm',
          type: 'llama',
          url: 'http://example.com/llm.bin',
          name: 'Test LLM',
          size: 1024,
          accuracy: 8,
          speed: 5,
          path: '/path/to/llm.bin',
          hash: 'abc123hash',
        },
      ]
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: mockData })

      const result = await getListLlms(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.LIST)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toEqual(mockData)
      }
    })

    it('getListLlms handles invalid IPC result format', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: [{ id: 'missing-fields' }] })

      const result = await getListLlms(mockIpcRenderer)

      expect(result.status).toBe('error')
    })

    it('downloadLlm invokes topic with id', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: undefined })

      const result = await downloadLlm(mockIpcRenderer, 'model-id')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.DOWNLOAD, 'model-id')
      expect(result.status).toBe('success')
    })

    it('cancelDownloadLlm invokes topic with id', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await cancelDownloadLlm(mockIpcRenderer, 'model-id')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.CANCEL_DOWNLOAD, 'model-id')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })

    it('deleteLlm invokes topic with id', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await deleteLlm(mockIpcRenderer, 'model-id')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.DELETE, 'model-id')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })

    it('selectLlm invokes topic with id', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await selectLlm(mockIpcRenderer, 'model-id')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.SELECT, 'model-id')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })
  })
})
