import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@electron/database', () => ({
  recordingsRepo: {},
}))

vi.mock('node:fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    unlink: vi.fn(),
  },
}))

import fs from 'node:fs/promises'
import { handler } from './index'

describe('recordings handler', () => {
  let mockIpcMain: any
  let mockRepo: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockIpcMain = { handle: vi.fn() }
    mockRepo = {
      list: vi.fn(),
      findById: vi.fn(),
      delete: vi.fn(),
    }
  })

  it('listRecordings returns data from repo', async () => {
    const mockData = [
      {
        id: '1',
        audioFilePath: 'path',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        duration: 1000,
        transcribedText: null,
        enhancedText: null,
        shortcutVersionId: 'v1',
        modelId: 'm1',
        llmId: null,
      },
    ]
    mockRepo.list.mockResolvedValue(mockData)
    handler(mockIpcMain, { repo: mockRepo })

    const callback = mockIpcMain.handle.mock.calls.find((params: string[]) => params[0] === 'recordings/list')[1]
    const result = await callback()

    expect(result.status).toBe('success')
    expect(result.data).toEqual(mockData)
    expect(mockRepo.list).toHaveBeenCalled()
  })

  it('deleteRecording deletes file and db entry', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1', audioFilePath: 'path.wav' })
    vi.mocked(fs.unlink).mockResolvedValue(undefined)
    mockRepo.delete.mockResolvedValue(undefined)

    handler(mockIpcMain, { repo: mockRepo })
    const callback = mockIpcMain.handle.mock.calls.find((params: string[]) => params[0] === 'recordings/delete')[1]
    const result = await callback({}, '1')

    expect(result.status).toBe('success')
    expect(result.data).toBe(true)
    expect(fs.unlink).toHaveBeenCalledWith('path.wav')
    expect(mockRepo.delete).toHaveBeenCalledWith('1')
  })

  it('deleteRecording handles missing file gracefully', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1', audioFilePath: 'path.wav' })
    vi.mocked(fs.unlink).mockRejectedValue(new Error('ENOENT'))
    mockRepo.delete.mockResolvedValue(undefined)
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    handler(mockIpcMain, { repo: mockRepo })
    const callback = mockIpcMain.handle.mock.calls.find((params: string[]) => params[0] === 'recordings/delete')[1]
    const result = await callback({}, '1')

    expect(result.status).toBe('success')
    expect(result.data).toBe(true)
    expect(mockRepo.delete).toHaveBeenCalledWith('1')
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to delete audio file'), expect.any(Error))
    consoleSpy.mockRestore()
  })
})
