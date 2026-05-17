import type { IpcMain, IpcRenderer } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from '../types'
import { createIpcResultSchema, handleValidationError, wrapIpcHandler } from '../utils'

export const TOPICS = {
  GET_INFO: 'app:get-info',
} as const

export const AppInfoSchema = v.object({
  version: v.string(),
  osVersion: v.string(),
  nodeVersion: v.string(),
  electronVersion: v.string(),
  chromeVersion: v.string(),
})

export type AppInfo = v.InferOutput<typeof AppInfoSchema>

export const registerGetAppInfo = (ipc: IpcMain, handler: () => AppInfo | Promise<AppInfo>) => {
  ipc.handle(
    TOPICS.GET_INFO,
    wrapIpcHandler(TOPICS.GET_INFO, async (): Promise<IpcResult<AppInfo>> => {
      const result = await handler()
      const validated = v.safeParse(AppInfoSchema, result)
      if (!validated.success) return handleValidationError(validated.issues, result)
      return { status: 'success', data: validated.output }
    }),
  )
}

export const getAppInfo = async (ipc: IpcRenderer): Promise<IpcResult<AppInfo>> => {
  const result = await ipc.invoke(TOPICS.GET_INFO)
  const validated = v.safeParse(createIpcResultSchema(AppInfoSchema), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}
