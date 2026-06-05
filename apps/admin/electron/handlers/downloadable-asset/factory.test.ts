import fs from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type AssetItem, createHandlers, type StorageAdapter } from './factory'

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(),
    promises: {
      unlink: vi.fn(),
    },
    unlink: vi.fn(),
  },
}))

vi.mock('@weesper/ipc', () => ({
  updateDownloadProgress: vi.fn(),
}))

vi.mock('../../utils/hash', () => ({
  calculateFileHash: vi.fn(),
}))

describe('downloadable-asset factory', () => {
  const mockItems: AssetItem[] = [
    {
      id: 'item-1',
      url: 'http://example.com/item1.bin',
      path: '/path/to/item1.bin',
      hash: 'hash-1',
      size: 100,
    },
    {
      id: 'item-2',
      url: 'http://example.com/item2.bin',
      path: '/path/to/item2.bin',
      hash: 'hash-2',
      size: 200,
    },
  ]

  let mockStorage: StorageAdapter
  let onSelect: any

  beforeEach(() => {
    vi.clearAllMocks()
    onSelect = vi.fn()
    mockStorage = {
      getDownloadedHash: vi.fn(),
      setDownloadedHash: vi.fn(),
      removeDownloadedHash: vi.fn(),
      getSelectedId: vi.fn(),
      setSelected: vi.fn(),
    }
  })

  it('list() returns items with correct flags', async () => {
    mockStorage.getSelectedId = vi.fn().mockReturnValue('item-1')
    mockStorage.getDownloadedHash = vi.fn().mockReturnValue('hash-1')
    ;(fs.existsSync as any).mockImplementation((p: string) => p === '/path/to/item1.bin')

    const { list } = createHandlers({ items: mockItems, storage: mockStorage })
    const results = await list()

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      id: 'item-1',
      isDownloaded: true,
      isSelected: true,
    })
    expect(results[1]).toMatchObject({
      id: 'item-2',
      isDownloaded: false,
      isSelected: false,
    })
  })

  it('delete() unlinks file and removes hash', async () => {
    ;(fs.existsSync as any).mockReturnValue(true)
    const { delete: deleteHandler } = createHandlers({ items: mockItems, storage: mockStorage })

    const result = await deleteHandler('item-1')

    expect(result).toBe(true)
    expect(fs.promises.unlink).toHaveBeenCalledWith('/path/to/item1.bin')
    expect(mockStorage.removeDownloadedHash).toHaveBeenCalledWith('item-1')
  })

  it('delete() throws if item is selected', async () => {
    mockStorage.getSelectedId = vi.fn().mockReturnValue('item-1')
    const { delete: deleteHandler } = createHandlers({ items: mockItems, storage: mockStorage })

    await expect(deleteHandler('item-1')).rejects.toThrow('is selected and cannot be deleted')
  })

  it('select() calls storage.setSelected and onSelect on hash match', async () => {
    mockStorage.getDownloadedHash = vi.fn().mockReturnValue('hash-1')
    const { select } = createHandlers({ items: mockItems, storage: mockStorage, onSelect })

    const result = await select('item-1', 'extra-arg')

    expect(result).toBe(true)
    expect(mockStorage.setSelected).toHaveBeenCalledWith('item-1', 'extra-arg')
    expect(onSelect).toHaveBeenCalledWith(mockItems[0])
  })

  it('select() returns false on hash mismatch', async () => {
    mockStorage.getDownloadedHash = vi.fn().mockReturnValue('wrong-hash')
    const { select } = createHandlers({ items: mockItems, storage: mockStorage, onSelect })

    const result = await select('item-1')

    expect(result).toBe(false)
    expect(mockStorage.setSelected).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
  })
})
