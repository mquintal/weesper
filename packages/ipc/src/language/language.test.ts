import type { IpcMainInvokeEvent } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getListLanguages, registerListLanguages, TOPICS } from './language'

describe('Language IPC module', () => {
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
    it('registerListLanguages registers topic', async () => {
      const mockData = [{ code: 'en', language: 'English' }]
      const mockHandler = vi.fn().mockResolvedValue(mockData)
      registerListLanguages(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.LIST, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toEqual(mockData)
    })
  })

  describe('Renderer Process callers', () => {
    it('getListLanguages invokes topic', async () => {
      const mockData = [{ code: 'en', language: 'English' }]
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: mockData })

      const result = await getListLanguages(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.LIST)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toEqual(mockData)
      }
    })
  })
})
