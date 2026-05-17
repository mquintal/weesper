import type { IpcMainInvokeEvent } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAccessibilityGrant,
  postAccessibilityGrant,
  registerGetAccessibilityGrant,
  registerPostAccessibilityGrant,
  TOPICS,
} from './accessibility'

describe('Accessibility IPC module', () => {
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
    it('registerGetAccessibilityGrant registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerGetAccessibilityGrant(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.GET_GRANT, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
    })

    it('registerPostAccessibilityGrant registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerPostAccessibilityGrant(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.POST_GRANT, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
    })
  })

  describe('Renderer Process callers', () => {
    it('getAccessibilityGrant invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await getAccessibilityGrant(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.GET_GRANT)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })

    it('postAccessibilityGrant invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await postAccessibilityGrant(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.POST_GRANT)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })
  })
})
