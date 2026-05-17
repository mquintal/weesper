import type { IpcMain, IpcRenderer } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from '../types'
import { createIpcResultSchema, handleValidationError } from '../utils'

export const TOPICS = {
  GET_ONBOARD: 'onboard/get',
  POST_ONBOARD: 'onboard/post',
} as const

export const registerGetOnboarded = (ipc: IpcMain, handler: () => boolean | Promise<boolean>) => {
  ipc.handle(TOPICS.GET_ONBOARD, async (): Promise<IpcResult<boolean>> => {
    const result = await handler()
    const validated = v.safeParse(v.boolean(), result)
    if (!validated.success) return handleValidationError(validated.issues, result)
    return { status: 'success', data: validated.output }
  })
}

export const registerPostOnboarded = (ipc: IpcMain, handler: () => boolean | Promise<boolean>) => {
  ipc.handle(TOPICS.POST_ONBOARD, async (): Promise<IpcResult<boolean>> => {
    const result = await handler()
    const validated = v.safeParse(v.boolean(), result)
    if (!validated.success) return handleValidationError(validated.issues, result)
    return { status: 'success', data: validated.output }
  })
}

export const getOnboarded = async (ipc: IpcRenderer): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.GET_ONBOARD)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const postOnboarded = async (ipc: IpcRenderer): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.POST_ONBOARD)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}
