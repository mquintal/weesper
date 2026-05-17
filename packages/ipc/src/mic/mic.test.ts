import type { IpcMainInvokeEvent } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getMicGrant,
  getMicInUse,
  postMicGrant,
  registerGetMicGrant,
  registerGetMicInUse,
  registerPostMicGrant,
  registerSetMicInUse,
  setMicInUse,
  TOPICS,
} from './mic'

describe('Mic IPC module', () => {
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
    it('registerGetMicGrant registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue('granted')
      registerGetMicGrant(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.GRANT.GET, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe('granted')
    })

    it('registerPostMicGrant registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue('granted')
      registerPostMicGrant(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.GRANT.POST, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe('granted')
    })

    it('registerGetMicInUse registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue('mic-123')
      registerGetMicInUse(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.IN_USE.GET, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe('mic-123')
    })

    it('registerSetMicInUse registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerSetMicInUse(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.IN_USE.SET, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'mic-123')

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('mic-123')
    })
  })

  describe('Renderer Process callers', () => {
    it('getMicGrant invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: 'granted' })

      const result = await getMicGrant(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.GRANT.GET)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe('granted')
      }
    })

    it('postMicGrant invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: 'granted' })

      const result = await postMicGrant(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.GRANT.POST)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe('granted')
      }
    })

    it('getMicInUse invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: 'mic-123' })

      const result = await getMicInUse(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.IN_USE.GET)
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe('mic-123')
      }
    })

    it('setMicInUse invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })

      const result = await setMicInUse(mockIpcRenderer, 'mic-123')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.IN_USE.SET, 'mic-123')
      expect(result.status).toBe('success')
      if (result.status === 'success') {
        expect(result.data).toBe(true)
      }
    })
  })
})
