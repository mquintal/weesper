import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listenToWidgetStatus, TOPICS, updateWidgetStatus } from './widget'

describe('Widget IPC module', () => {
  let mockIpcRenderer: any

  beforeEach(() => {
    mockIpcRenderer = {
      on: vi.fn(),
    }
  })

  describe('Main Process handlers', () => {
    it('updateWidgetStatus sends status to webContents', () => {
      const mockWindow = {
        webContents: {
          send: vi.fn(),
        },
      } as any
      updateWidgetStatus(mockWindow, 'recording')
      expect(mockWindow.webContents.send).toHaveBeenCalledWith(TOPICS.STATUS, 'recording')
    })

    it('updateWidgetStatus safely handles undefined window', () => {
      expect(() => updateWidgetStatus(undefined, 'recording')).not.toThrow()
    })
  })

  describe('Renderer Process callers', () => {
    it('listenToWidgetStatus registers on handler', () => {
      const mockHandler = vi.fn()
      listenToWidgetStatus(mockIpcRenderer, mockHandler)

      expect(mockIpcRenderer.on).toHaveBeenCalledWith(TOPICS.STATUS, expect.any(Function))

      const callback = mockIpcRenderer.on.mock.calls[0][1]
      callback({}, 'enhancing')
      expect(mockHandler).toHaveBeenCalledWith('enhancing')
    })
  })
})
