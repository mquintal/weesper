import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@electron/database', () => ({
  shortcutsRepo: {},
}))

vi.mock('node:crypto', () => ({
  default: {
    randomUUID: vi.fn().mockReturnValue('uuid'),
  },
}))

import { handler } from './index'

describe('shortcuts handler', () => {
  let mockIpcMain: any
  let mockRepo: any

  beforeEach(() => {
    mockIpcMain = { handle: vi.fn() }
    mockRepo = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      list: vi.fn(),
      softDelete: vi.fn(),
    }
  })

  it('getDefaultShortcut returns UI formatted shortcut', async () => {
    mockRepo.findById.mockResolvedValue({ shortcut: 'CommandOrControl+R' })
    handler(mockIpcMain, { getWindow: () => null, repo: mockRepo })

    const callback = mockIpcMain.handle.mock.calls.find((params: string[]) => params[0] === 'shortcuts/default/get')[1]
    const result = await callback()

    expect(result.status).toBe('success')
    expect(result.data).toBe('⌘ + R')
  })

  it('setDefaultShortcut increments version for existing shortcut', async () => {
    mockRepo.findById.mockResolvedValue({ currentVersion: 5 })
    handler(mockIpcMain, {
      getWindow: () => null,
      repo: mockRepo,
    })

    const callback = mockIpcMain.handle.mock.calls.find((params: string[]) => params[0] === 'shortcuts/default/set')[1]
    const result = await callback({}, '⌘ + R')

    expect(result.status).toBe('success')
    expect(result.data).toBe(true)

    expect(mockRepo.update).toHaveBeenCalledWith(
      'default',
      6,
      expect.objectContaining({ version: 6, shortcut: 'CommandOrControl+R' }),
    )
  })

  it('listShortcuts filters out default', async () => {
    const mockData = [
      {
        id: 'default',
        shortcut: 'CommandOrControl+D',
        shortcutId: 'default',
        version: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'custom-1',
        name: 'Custom',
        shortcut: 'CommandOrControl+C',
        shortcutId: 'custom-1',
        version: 1,
        createdAt: new Date().toISOString(),
      },
    ]
    mockRepo.list.mockResolvedValue(mockData)
    handler(mockIpcMain, { getWindow: () => null, repo: mockRepo })

    const callback = mockIpcMain.handle.mock.calls.find((params: string[]) => params[0] === 'shortcuts/list')[1]
    const result = await callback()

    expect(result.status).toBe('success')
    expect(result.data).toHaveLength(1)
    expect(result.data[0].id).toBe('custom-1')
    expect(result.data[0].shortcut).toBe('⌘ + C')
  })

  it('ensureDefaultShortcut creates default if not exists', async () => {
    mockRepo.findById.mockResolvedValue(null)
    const { ensureDefaultShortcut } = handler(mockIpcMain, { getWindow: () => null, repo: mockRepo })

    await ensureDefaultShortcut()

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'default' }),
      expect.objectContaining({ shortcut: 'CommandOrControl+Alt+R', name: 'default' }),
    )
  })

  it('ensureDefaultShortcut does nothing if default exists', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'default' })
    const { ensureDefaultShortcut } = handler(mockIpcMain, { getWindow: () => null, repo: mockRepo })

    await ensureDefaultShortcut()

    expect(mockRepo.create).not.toHaveBeenCalled()
  })
})
