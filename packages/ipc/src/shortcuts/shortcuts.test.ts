import type { IpcMainInvokeEvent } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createShortcut,
  deleteShortcut,
  getDefaultShortcut,
  getListShortcuts,
  listenForToggleRecording,
  registerCreateShortcut,
  registerDeleteShortcut,
  registerGetDefaultShortcut,
  registerListShortcuts,
  registerSetDefaultShortcut,
  registerUpdateShortcut,
  sendToggleRecording,
  setDefaultShortcut,
  TOPICS,
  updateShortcut,
} from './shortcuts'

describe('Shortcuts IPC module', () => {
  let mockIpcMain: any
  let mockIpcRenderer: any

  beforeEach(() => {
    mockIpcMain = {
      handle: vi.fn(),
    }

    mockIpcRenderer = {
      invoke: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }
  })

  describe('Main Process handlers', () => {
    it('registerGetDefaultShortcut registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue('Cmd+Space')
      registerGetDefaultShortcut(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.DEFAULT_GET, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe('Cmd+Space')
    })

    it('registerSetDefaultShortcut registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerSetDefaultShortcut(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.DEFAULT_SET, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'Cmd+Space')

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
      expect(mockHandler).toHaveBeenCalledWith('Cmd+Space')
    })

    it('registerListShortcuts registers topic', async () => {
      const mockData = [
        {
          id: '1',
          name: 's1',
          shortcut: 'Cmd+1',
          prompt: 'p1',
          shortcutId: 'sid-1',
          version: 1,
          createdAt: new Date().toISOString(),
        },
      ]
      const mockHandler = vi.fn().mockResolvedValue(mockData)
      registerListShortcuts(mockIpcMain, mockHandler)
      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.LIST, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toEqual(mockData)
    })

    it('registerCreateShortcut registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerCreateShortcut(mockIpcMain, mockHandler)
      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.CREATE, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const shortcut = { name: 's1', shortcut: 'Cmd+1', prompt: 'p1' }
      const result = await callback({} as IpcMainInvokeEvent, shortcut)

      expect(result.status).toBe('success')
      expect(mockHandler).toHaveBeenCalledWith(shortcut)
    })

    it('registerUpdateShortcut registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerUpdateShortcut(mockIpcMain, mockHandler)
      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.UPDATE, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const shortcut = { name: 's1', shortcut: 'Cmd+1', prompt: 'p1' }
      const result = await callback({} as IpcMainInvokeEvent, '1', shortcut)

      expect(result.status).toBe('success')
      expect(mockHandler).toHaveBeenCalledWith('1', shortcut)
    })

    it('registerDeleteShortcut registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerDeleteShortcut(mockIpcMain, mockHandler)
      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.DELETE, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, '1')

      expect(result.status).toBe('success')
      expect(mockHandler).toHaveBeenCalledWith('1')
    })

    it('sendToggleRecording sends event via webContents', () => {
      const mockWindow = {
        webContents: {
          send: vi.fn(),
        },
      } as any
      sendToggleRecording(mockWindow, 'shortcut-name')
      expect(mockWindow.webContents.send).toHaveBeenCalledWith(TOPICS.TOGGLE, 'shortcut-name')
    })
  })

  describe('Renderer Process callers', () => {
    it('getDefaultShortcut invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: 'Cmd+Space' })
      const result = await getDefaultShortcut(mockIpcRenderer)
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.DEFAULT_GET)
      expect(result.status).toBe('success')
    })

    it('setDefaultShortcut invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })
      const result = await setDefaultShortcut(mockIpcRenderer, 'Cmd+Space')
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.DEFAULT_SET, 'Cmd+Space')
      expect(result.status).toBe('success')
    })

    it('getListShortcuts invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: [] })
      const result = await getListShortcuts(mockIpcRenderer)
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.LIST)
      expect(result.status).toBe('success')
    })

    it('createShortcut invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })
      const shortcut = { name: 's1', shortcut: 'Cmd+1', prompt: 'p1' }
      const result = await createShortcut(mockIpcRenderer, shortcut)
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.CREATE, shortcut)
      expect(result.status).toBe('success')
    })

    it('updateShortcut invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })
      const shortcut = { name: 's1', shortcut: 'Cmd+1', prompt: 'p1' }
      const result = await updateShortcut(mockIpcRenderer, '1', shortcut)
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.UPDATE, '1', shortcut)
      expect(result.status).toBe('success')
    })

    it('deleteShortcut invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })
      const result = await deleteShortcut(mockIpcRenderer, '1')
      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.DELETE, '1')
      expect(result.status).toBe('success')
    })

    it('listenForToggleRecording registers on and returns off function', () => {
      const mockHandler = vi.fn()
      const off = listenForToggleRecording(mockIpcRenderer, mockHandler)

      expect(mockIpcRenderer.on).toHaveBeenCalledWith(TOPICS.TOGGLE, expect.any(Function))

      const callback = mockIpcRenderer.on.mock.calls[0][1]
      callback({}, 'shortcut-name')
      expect(mockHandler).toHaveBeenCalledWith('shortcut-name')

      off()
      expect(mockIpcRenderer.off).toHaveBeenCalledWith(TOPICS.TOGGLE, expect.any(Function))
    })
  })
})
