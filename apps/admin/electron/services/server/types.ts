export enum ServerStatus {
  IDLE = 'idle',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  ERROR = 'error',
}

export interface ServerProcessOptions {
  /** Absolute path to the server executable */
  executable: string
  /** Default port to bind to */
  port: number
  /** CLI arguments (port is managed internally; do NOT include --port) */
  args: string[]
  /** Max retry attempts on start failure (default: 3) */
  maxRetries?: number
  /** Health check timeout in ms (default: 5000) */
  healthCheckTimeout?: number
  /** Health check poll interval in ms (default: 200) */
  healthCheckInterval?: number
  /** Optional p-retry options */
  retryOptions?: {
    factor?: number
    minTimeout?: number
    maxTimeout?: number
    randomize?: boolean
  }
}
