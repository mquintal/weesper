import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { createManagedService } from './factory'
import { ServerProcess } from './server-process'

// Mock ServerProcess
vi.mock('./server-process', () => {
  const ServerProcess = vi.fn()
  ServerProcess.prototype.start = vi.fn().mockResolvedValue(undefined)
  ServerProcess.prototype.stop = vi.fn().mockResolvedValue(undefined)
  ServerProcess.prototype.healthCheck = vi.fn().mockResolvedValue(true)
  ServerProcess.prototype.port = 8000
  ServerProcess.prototype.status = 'idle'
  return { ServerProcess }
})

describe('ManagedService Factory', () => {
  const mockConfig = {
    name: 'test-service',
    executable: '/path/to/exe',
    port: 8000,
    resolveModel: vi.fn(),
    execute: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockConfig.resolveModel.mockReturnValue({
      path: '/path/to/model',
      args: ['--arg1'],
    })
    mockConfig.execute.mockResolvedValue('success')
  })

  it('should initialize and start the server when model is resolved', async () => {
    const service = createManagedService(mockConfig)
    await service.init()

    expect(ServerProcess).toHaveBeenCalledWith({
      executable: mockConfig.executable,
      port: mockConfig.port,
      args: ['--arg1'],
    })
    const instance = (ServerProcess as unknown as Mock).mock.results[0].value
    expect(instance.start).toHaveBeenCalled()
  })

  it('should not start server if resolveModel returns null', async () => {
    mockConfig.resolveModel.mockReturnValue(null)
    const service = createManagedService(mockConfig)

    await service.init()
    expect(ServerProcess).not.toHaveBeenCalled()
  })

  it('should call stop on the server instance', async () => {
    const service = createManagedService(mockConfig)
    await service.init()
    const instance = (ServerProcess as unknown as Mock).mock.results[0].value

    await service.stop()
    expect(instance.stop).toHaveBeenCalled()
  })

  it('should execute request successfully when server is healthy', async () => {
    const service = createManagedService(mockConfig)
    await service.init()
    const instance = (ServerProcess as unknown as Mock).mock.results[0].value
    instance.healthCheck.mockResolvedValue(true)

    const result = await service.request('input-data')

    expect(result).toBe('success')
    expect(mockConfig.execute).toHaveBeenCalledWith(8000, 'input-data')
    expect(instance.healthCheck).toHaveBeenCalled()
  })

  it('should attempt restart and retry if server is unhealthy', async () => {
    const service = createManagedService(mockConfig)
    await service.init()
    const instance = (ServerProcess as unknown as Mock).mock.results[0].value

    // First call unhealthy, second call healthy (after restart)
    instance.healthCheck.mockResolvedValueOnce(false).mockResolvedValueOnce(true)

    const result = await service.request('input-data')

    expect(instance.stop).toHaveBeenCalled()
    expect(instance.start).toHaveBeenCalledTimes(2) // Initial + Restart
    expect(result).toBe('success')
    expect(mockConfig.execute).toHaveBeenCalled()
  })

  it('should throw error if service is unhealthy even after restart', async () => {
    const service = createManagedService(mockConfig)
    await service.init()
    const instance = (ServerProcess as unknown as Mock).mock.results[0].value

    instance.healthCheck.mockResolvedValue(false)

    await expect(service.request('data')).rejects.toThrow('Service is not ready')
    expect(instance.start).toHaveBeenCalledTimes(2) // Initial + Restart
  })

  it('should throw if request is called before init', async () => {
    const service = createManagedService(mockConfig)
    await expect(service.request('data')).rejects.toThrow('Service is not initialized')
  })
})
