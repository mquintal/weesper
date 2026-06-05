import { logger } from '@weesper/logger'
import type { IpcMain, IpcRenderer } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from './types'

export const handleValidationError = <T>(issues: v.GenericIssue[], input: unknown): IpcResult<T> => {
  const errors = issues.map((i) => i.message)
  logger.error('IPC Validation Error:', { errors: errors.join('; '), input: JSON.stringify(input) })
  return { status: 'error', data: errors }
}

export const createIpcResultSchema = <T>(dataSchema: v.BaseSchema<any, T, any>) => {
  return v.union([
    v.object({
      status: v.literal('success'),
      data: dataSchema,
    }),
    v.object({
      status: v.literal('error'),
      data: v.array(v.string()),
    }),
  ])
}

export const wrapIpcHandler = <T>(
  topic: string,
  handler: (...args: any[]) => Promise<IpcResult<T>>,
): ((...args: any[]) => Promise<IpcResult<T>>) => {
  return async (...args: any[]) => {
    try {
      return await handler(...args)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`[IPC][${topic}] Unexpected error`, { error: message })
      return { status: 'error', data: [message] }
    }
  }
}

/**
 * Creates a main process IPC handler with built-in validation and error wrapping.
 */
export const createMainHandler = <TArgs extends any[], TResponse>(
  ipc: IpcMain,
  topic: string,
  schemas: v.BaseSchema<any, any, any>[],
  handler: (...args: TArgs) => Promise<TResponse> | TResponse,
) => {
  ipc.handle(
    topic,
    wrapIpcHandler(topic, async (_event, ...args: unknown[]): Promise<IpcResult<TResponse>> => {
      const validatedArgs: any[] = []
      for (let i = 0; i < schemas.length; i++) {
        const validated = v.safeParse(schemas[i], args[i])
        if (!validated.success) return handleValidationError(validated.issues, args[i])
        validatedArgs.push(validated.output)
      }
      const result = await handler(...(validatedArgs as TArgs))
      return { status: 'success', data: result }
    }),
  )
}

/**
 * Creates a renderer process IPC invoker with built-in response validation.
 */
export const createRendererInvoker = <TArgs extends any[], TResponse>(
  topic: string,
  responseSchema: v.BaseSchema<any, TResponse, any>,
) => {
  return async (ipc: IpcRenderer, ...args: TArgs): Promise<IpcResult<TResponse>> => {
    const result = await ipc.invoke(topic, ...args)
    const validated = v.safeParse(createIpcResultSchema(responseSchema), result)
    if (!validated.success) return handleValidationError(validated.issues, result)
    return validated.output
  }
}
