import type { IpcMainInvokeEvent } from 'electron'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  pasteText,
  registerPasteText,
  registerRecordingChunk,
  registerStartRecording,
  registerStopRecording,
  sendRecordingChunk,
  startRecording,
  stopRecording,
  TOPICS,
} from './speech-to-text'

describe('Speech to Text IPC module', () => {
  let mockIpcMain: any
  let mockIpcRenderer: any

  beforeEach(() => {
    mockIpcMain = {
      handle: vi.fn(),
      on: vi.fn(),
    }

    mockIpcRenderer = {
      invoke: vi.fn(),
      send: vi.fn(),
    }
  })

  describe('Main Process handlers', () => {
    it('registerStartRecording registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(true)
      registerStartRecording(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.START, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent)

      expect(result.status).toBe('success')
      expect(result.data).toBe(true)
    })

    it('registerStopRecording registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue('transcribed text')
      registerStopRecording(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.STOP, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'optional prompt')

      expect(result.status).toBe('success')
      expect(result.data).toBe('transcribed text')
      expect(mockHandler).toHaveBeenCalledWith('optional prompt')
    })

    it('registerStopRecording handles errors from handler', async () => {
      const mockHandler = vi.fn().mockRejectedValue(new Error('Test error'))
      registerStopRecording(mockIpcMain, mockHandler)

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'optional prompt')

      expect(result.status).toBe('error')
      expect(result.data).toEqual(['Test error'])
    })

    it('registerRecordingChunk registers on handler', () => {
      const mockHandler = vi.fn()
      registerRecordingChunk(mockIpcMain, mockHandler)

      expect(mockIpcMain.on).toHaveBeenCalledWith(TOPICS.CHUNK, expect.any(Function))

      const callback = mockIpcMain.on.mock.calls[0][1]
      const chunk = new ArrayBuffer(8)
      callback({}, chunk)

      expect(mockHandler).toHaveBeenCalledWith(chunk)
    })

    it('registerPasteText registers topic', async () => {
      const mockHandler = vi.fn().mockResolvedValue(undefined)
      registerPasteText(mockIpcMain, mockHandler)

      expect(mockIpcMain.handle).toHaveBeenCalledWith(TOPICS.PASTE_TEXT, expect.any(Function))

      const callback = mockIpcMain.handle.mock.calls[0][1]
      const result = await callback({} as IpcMainInvokeEvent, 'text to paste')

      expect(result.status).toBe('success')
      expect(mockHandler).toHaveBeenCalledWith('text to paste')
    })
  })

  describe('Renderer Process callers', () => {
    it('startRecording invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: true })
      const result = await startRecording(mockIpcRenderer)

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.START)
      expect(result.status).toBe('success')
    })

    it('stopRecording invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: 'transcribed text' })
      const result = await stopRecording(mockIpcRenderer, 'optional prompt')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.STOP, 'optional prompt')
      expect(result.status).toBe('success')
    })

    it('pasteText invokes topic', async () => {
      mockIpcRenderer.invoke.mockResolvedValue({ status: 'success', data: undefined })
      const result = await pasteText(mockIpcRenderer, 'text to paste')

      expect(mockIpcRenderer.invoke).toHaveBeenCalledWith(TOPICS.PASTE_TEXT, 'text to paste')
      expect(result.status).toBe('success')
    })

    it('sendRecordingChunk sends topic', () => {
      const chunk = new ArrayBuffer(8)
      sendRecordingChunk(mockIpcRenderer, chunk)

      expect(mockIpcRenderer.send).toHaveBeenCalledWith(TOPICS.CHUNK, chunk)
    })
  })
})
