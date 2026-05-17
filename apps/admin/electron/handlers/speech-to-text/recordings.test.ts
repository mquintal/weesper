import { describe, expect, it, vi } from 'vitest'

vi.mock('@electron/database', () => ({
  recordingsRepo: {},
}))

vi.mock('node:fs/promises', () => ({
  default: {
    mkdir: vi.fn(),
    writeFile: vi.fn(),
  },
}))

vi.mock('node:crypto', () => ({
  default: {
    randomUUID: vi.fn().mockReturnValue('uuid-1'),
  },
}))

import fs from 'node:fs/promises'
import type { Model } from '@open-bisbis/ipc'
import { createRecording } from './recordings'

describe('STT recordings helper', () => {
  it('createRecording calculates duration and saves data', async () => {
    const mockRepo = { create: vi.fn().mockResolvedValue('rec-1') }
    const mockBuffer = Buffer.alloc(32000) // 1 second
    const mockModel = { id: 'model-1' } as Model

    const result = await createRecording(
      {
        wavBuffer: mockBuffer,
        selectedModel: mockModel,
        shortcutVersionId: 'sid-1',
      },
      {
        repo: mockRepo as any,
        getRecordingsDir: () => '/mock/recordings',
      },
    )

    expect(result).toBe('rec-1')
    expect(fs.mkdir).toHaveBeenCalledWith('/mock/recordings', { recursive: true })
    expect(fs.writeFile).toHaveBeenCalledWith('/mock/recordings/uuid-1.wav', mockBuffer)
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 1000,
        audioFilePath: '/mock/recordings/uuid-1.wav',
        modelId: 'model-1',
        shortcutVersionId: 'sid-1',
      }),
    )
  })
})
