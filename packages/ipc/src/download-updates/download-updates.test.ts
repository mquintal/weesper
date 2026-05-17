import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listenForDownloadProgress, TOPICS, updateDownloadProgress } from './download-updates'

describe('Download Updates IPC module', () => {
  let mockIpcRenderer: any

  beforeEach(() => {
    mockIpcRenderer = {
      on: vi.fn(),
      off: vi.fn(),
    }
  })

  describe('Main Process handlers', () => {
    it('updateDownloadProgress sends event to sender', () => {
      const mockEvent = {
        sender: {
          send: vi.fn(),
        },
      } as any
      const data = { id: 'model-1', percentage: 50, state: 'progress' as const }

      updateDownloadProgress(mockEvent, data)
      expect(mockEvent.sender.send).toHaveBeenCalledWith(TOPICS.PROGRESS, data)
    })
  })

  describe('Renderer Process callers', () => {
    it('listenForDownloadProgress registers on and returns off function', () => {
      const mockHandler = vi.fn()
      const off = listenForDownloadProgress(mockIpcRenderer, mockHandler)

      expect(mockIpcRenderer.on).toHaveBeenCalledWith(TOPICS.PROGRESS, expect.any(Function))

      const callback = mockIpcRenderer.on.mock.calls[0][1]
      const data = { id: 'model-1', percentage: 50, state: 'progress' }
      callback({}, data)
      expect(mockHandler).toHaveBeenCalledWith(data)

      off()
      expect(mockIpcRenderer.off).toHaveBeenCalledWith(TOPICS.PROGRESS, expect.any(Function))
    })

    it('listenForDownloadProgress handles invalid payload safely', () => {
      const mockHandler = vi.fn()
      listenForDownloadProgress(mockIpcRenderer, mockHandler)

      const callback = mockIpcRenderer.on.mock.calls[0][1]
      const invalidData = { id: 'model-1' } // Missing fields
      callback({}, invalidData)

      expect(mockHandler).not.toHaveBeenCalled()
    })
  })
})
