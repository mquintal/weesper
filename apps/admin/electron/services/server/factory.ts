import { logger } from '@open-bisbis/logger'
import { ServerProcess } from './server-process'

interface ServiceModelConfig {
  path: string
  args: string[]
}

interface ServiceConfig<TInput, TOutput> {
  name: string
  executable: string
  port: number
  healthCheckTimeout?: number
  resolveModel: () => ServiceModelConfig | null
  execute: (port: number, input: TInput) => Promise<TOutput>
}

export function createManagedService<TInput, TOutput>(config: ServiceConfig<TInput, TOutput>) {
  let server: ServerProcess | null = null

  const init = async (): Promise<void> => {
    const model = config.resolveModel()
    if (model) {
      server = new ServerProcess({
        executable: config.executable,
        port: config.port,
        args: model.args,
        healthCheckTimeout: config.healthCheckTimeout,
      })
      return server.start()
    }
    logger.warn(`[${config.name}] No model resolved or model file missing.`)
    return Promise.resolve()
  }

  const stop = async (): Promise<void> => {
    if (server) {
      await server.stop()
    }
  }

  const request = async (input: TInput, hasRetry = false): Promise<TOutput> => {
    if (!server) {
      throw new Error(`[${config.name}] Service is not initialized.`)
    }

    try {
      const isReady = await server.healthCheck()
      if (!isReady && !hasRetry) {
        logger.warn(`[${config.name}] Service unhealthy, attempting restart...`)
        try {
          await server.stop()
          await server.start()
          return request(input, true)
        } catch (restartError) {
          logger.error(`[${config.name}] Failed to restart service:`, {
            error: restartError instanceof Error ? restartError.message : String(restartError),
          })
          throw restartError
        }
      }

      if (!isReady) {
        throw new Error(`[${config.name}] Service is not ready.`)
      }

      return config.execute(server.port, input)
    } catch (error) {
      logger.error(`[${config.name}] Request failed:`, {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  return {
    init,
    stop,
    request,
  }
}
