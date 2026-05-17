import type { IpcMainInvokeEvent } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOnboarded, postOnboarded, registerGetOnboarded, registerPostOnboarded, TOPICS } from './onboard'

describe('Onboard IPC module', () => {
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
    it('registerGetOnboarded registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerGetOnboarded(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.GET_ONBOARD, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
    })

    it('registerPostOnboarded registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerPostOnboarded(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.POST_ONBOARD, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
    })
  })

  describe('Renderer Process callers', () => {
    it('getOnboarded invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await getOnboarded(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.GET_ONBOARD)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })

    it('postOnboarded invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await postOnboarded(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.POST_ONBOARD)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })
  })
})
