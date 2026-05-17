import type { IpcMain, IpcRenderer } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from '../types'
import { createIpcResultSchema, handleValidationError } from '../utils'

export const TOPICS = {
  GET_GRANT: 'accessibility-grant/get',
  POST_GRANT: 'accessibility-grant/post',
} as const

// Server methods
export const registerGetAccessibilityGrant = (ipc: IpcMain, handler: () => boolean | Promise<boolean>) => {
  ipc.handle(TOPICS.GET_GRANT, async (): Promise<IpcResult<boolean>> => {
    const result = await handler()
    const validated = v.safeParse(v.boolean(), result)
    if (!validated.success) return handleValidationError(validated.issues, result)
    return { status: 'success', data: validated.output }
  })
}

export const registerPostAccessibilityGrant = (ipc: IpcMain, handler: () => boolean | Promise<boolean>) => {
  ipc.handle(TOPICS.POST_GRANT, async (): Promise<IpcResult<boolean>> => {
    const result = await handler()
    const validated = v.safeParse(v.boolean(), result)
    if (!validated.success) return handleValidationError(validated.issues, result)
    return { status: 'success', data: validated.output }
  })
}

// Client methods
export const getAccessibilityGrant = async (ipc: IpcRenderer): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.GET_GRANT)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const postAccessibilityGrant = async (ipc: IpcRenderer): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.POST_GRANT)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}
