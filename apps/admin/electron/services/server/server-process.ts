import { EventEmitter } from 'node:events'
import { execa } from 'execa'
import kill from 'tree-kill'
import { type ServerProcessOptions, ServerStatus } from './types'

export class ServerProcess extends EventEmitter {
  private executable: string
  private basePort: number
  private args: string[]
  private maxRetries: number
  private healthCheckTimeout: number
  private healthCheckInterval: number
  private retryOptions: NonNullable<ServerProcessOptions['retryOptions']>

  private _port: number
  private _status: ServerStatus = ServerStatus.IDLE
  private _pid: number | null = null
  private _abortController: AbortController | null = null

  constructor(options: ServerProcessOptions) {
    super()
    this.executable = options.executable
    this.basePort = options.port
    this._port = options.port
    this.args = options.args
    this.maxRetries = options.maxRetries ?? 3
    this.healthCheckTimeout = options.healthCheckTimeout ?? 5000
    this.healthCheckInterval = options.healthCheckInterval ?? 200
    this.retryOptions = options.retryOptions ?? {}
  }

  get port(): number {
    return this._port
  }

  get status(): ServerStatus {
    return this._status
  }

  get pid(): number | null {
    return this._pid
  }

  get isRunning(): boolean {
    return this._status === ServerStatus.RUNNING
  }

  private setStatus(status: ServerStatus) {
    this._status = status
    this.emit('statusChange', status)
  }

  async start(): Promise<void> {
    if (this.isRunning || this._status === ServerStatus.STARTING) {
      return
    }

    this.setStatus(ServerStatus.STARTING)
    this._abortController = new AbortController()

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      if (this._abortController.signal.aborted) {
        this.setStatus(ServerStatus.IDLE)
        return
      }

      const currentPort = this.basePort + attempt - 1
      this._port = currentPort

      try {
        console.log(`[ServerProcess] Attempt ${attempt} starting on port ${currentPort}`)

        const subprocess = execa(this.executable, this.buildArgs(currentPort), {
          reject: false,
          cleanup: true,
        })

        this._pid = subprocess.pid ?? null

        subprocess.stdout?.on('data', (data) => this.emit('stdout', data.toString()))
        subprocess.stderr?.on('data', (data) => this.emit('stderr', data.toString()))

        await this.waitForHealthy(currentPort)

        this.setStatus(ServerStatus.RUNNING)
        console.log(`[ServerProcess] Server is healthy on port ${currentPort}`)
        return // Success!
      } catch (error: any) {
        console.warn(`[ServerProcess] Attempt ${attempt} failed: ${error.message}`)
        lastError = error
        await this.stopProcess()

        if (attempt <= this.maxRetries) {
          const delayTime = this.retryOptions.minTimeout ?? 1000
          console.log(`[ServerProcess] Retrying in ${delayTime}ms...`)
          await this.delay(delayTime)
        }
      }
    }

    this.setStatus(ServerStatus.ERROR)
    const finalError = lastError ?? new Error('Failed to start server')
    this.emit('error', finalError)
    throw finalError
  }

  async stop(): Promise<void> {
    if (this._status === ServerStatus.IDLE || this._status === ServerStatus.STOPPING) {
      return
    }

    this.setStatus(ServerStatus.STOPPING)
    this._abortController?.abort()

    await this.stopProcess()

    this._pid = null
    this.setStatus(ServerStatus.IDLE)
  }

  async restart(): Promise<void> {
    await this.stop()
    await this.start()
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`http://127.0.0.1:${this._port}/health`)
      const body = (await res.json()) as { status: string }
      return body.status === 'ok'
    } catch {
      return false
    }
  }

  private async waitForHealthy(port: number): Promise<void> {
    const maxAttempts = Math.ceil(this.healthCheckTimeout / this.healthCheckInterval)
    const deadline = Date.now() + this.healthCheckTimeout

    for (let attempt = 0; attempt <= maxAttempts; attempt++) {
      if (this._abortController?.signal.aborted) {
        throw new Error('Start aborted')
      }

      const isHealthy = await this.healthCheck()
      if (isHealthy) {
        return
      }

      if (Date.now() >= deadline && attempt > 0) {
        break
      }

      await this.delay(this.healthCheckInterval)
    }

    throw new Error(`Health check timed out on port ${port}`)
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private async stopProcess(): Promise<void> {
    if (!this._pid) return

    const pid = this._pid
    console.log(`[ServerProcess] Stopping process with PID ${pid}`)

    return new Promise((resolve) => {
      const forceKillTimeout = setTimeout(() => {
        console.warn(`[ServerProcess] Process ${pid} did not exit, force killing...`)
        kill(pid, 'SIGKILL', () => {
          resolve()
        })
      }, 2000)

      kill(pid, 'SIGTERM', () => {
        clearTimeout(forceKillTimeout)
        resolve()
      })
    })
  }

  private buildArgs(port: number): string[] {
    const newArgs = [...this.args]
    const portIndex = newArgs.indexOf('--port')

    if (portIndex !== -1 && portIndex + 1 < newArgs.length) {
      newArgs[portIndex + 1] = String(port)
    } else {
      newArgs.push('--port', String(port))
    }

    return newArgs
  }
}
