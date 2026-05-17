import { execa } from 'execa'
import kill from 'tree-kill'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ServerProcess } from './server-process'
import { ServerStatus } from './types'

vi.mock('execa', () => ({
  execa: vi.fn(),
}))
vi.mock('tree-kill', () => ({
  default: vi.fn((_pid, signal, cb) => {
    if (typeof signal === 'function') signal()
    else if (cb) cb()
  }),
}))

describe('ServerProcess', () => {
  const createMockProcess = (pid = 123) => ({
    pid,
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
  })

  const options = {
    executable: '/path/to/exe',
    port: 8000,
    args: ['--flag'],
    maxRetries: 2,
    healthCheckTimeout: 200,
    healthCheckInterval: 20,
    retryOptions: {
      minTimeout: 10,
      factor: 1,
    },
  }

  let server: ServerProcess

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ status: 'error' }),
      }),
    )
    server = new ServerProcess(options)
    // Mock delay to be near-instant but allow microtasks
    vi.spyOn(server as any, 'delay').mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 0)))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should initialize with IDLE status', () => {
    expect(server.status).toBe(ServerStatus.IDLE)
    expect(server.isRunning).toBe(false)
  })

  it('should start successfully when server is healthy', async () => {
    vi.mocked(execa).mockReturnValue(createMockProcess() as any)
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve({ status: 'ok' }),
    } as any)

    await server.start()

    expect(server.status).toBe(ServerStatus.RUNNING)
    expect(server.port).toBe(8000)
    expect(server.pid).toBe(123)
  })

  it('should retry with different port if first attempt fails', async () => {
    vi.mocked(execa).mockReturnValue(createMockProcess() as any)

    vi.mocked(global.fetch).mockImplementation(async (url: any) => {
      if (url.toString().includes(':8000/')) {
        return { json: async () => ({ status: 'starting' }) } as any
      }
      return { json: async () => ({ status: 'ok' }) } as any
    })

    await server.start()

    expect(server.port).toBe(8001)
    expect(execa).toHaveBeenCalledTimes(2)
  })

  it('should transition to ERROR status if all retries fail', async () => {
    vi.mocked(execa).mockReturnValue(createMockProcess() as any)
    vi.mocked(global.fetch).mockResolvedValue({ json: () => Promise.resolve({ status: 'error' }) } as any)

    await expect(server.start()).rejects.toThrow()
    expect(server.status).toBe(ServerStatus.ERROR)
  })

  it('should stop the process correctly', async () => {
    vi.mocked(execa).mockReturnValue(createMockProcess() as any)
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve({ status: 'ok' }),
    } as any)

    await server.start()

    await server.stop()

    expect(server.status).toBe(ServerStatus.IDLE)
    expect(server.pid).toBe(null)
    expect(kill).toHaveBeenCalledWith(123, 'SIGTERM', expect.any(Function))
  })

  it('should restart correctly', async () => {
    const stopSpy = vi.spyOn(server, 'stop')
    const startSpy = vi.spyOn(server, 'start')

    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve({ status: 'ok' }),
    } as any)

    await server.restart()

    expect(stopSpy).toHaveBeenCalled()
    expect(startSpy).toHaveBeenCalled()
  })

  it('should emit statusChange events', async () => {
    const statusChanges: ServerStatus[] = []
    server.on('statusChange', (status) => statusChanges.push(status))

    vi.mocked(execa).mockReturnValue(createMockProcess() as any)
    vi.mocked(global.fetch).mockResolvedValue({
      json: () => Promise.resolve({ status: 'ok' }),
    } as any)

    await server.start()

    expect(statusChanges).toContain(ServerStatus.STARTING)
    expect(statusChanges).toContain(ServerStatus.RUNNING)
  })
})
