import type { IpcMain, IpcRenderer } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from '../types'
import { createIpcResultSchema, handleValidationError } from '../utils'

export const TOPICS = {
  GRANT: {
    GET: 'mic-grant/get',
    POST: 'mic-grant/post',
  },
  IN_USE: {
    GET: 'mic/get',
    SET: 'mic/set',
  },
} as const

const MicGrantStatusSchema = v.union([v.literal('granted'), v.literal('denied'), v.literal('idle')])

const MicIdSchema = v.string()

export type MicGrantStatus = v.InferOutput<typeof MicGrantStatusSchema>

// --- Permissions ---

export const registerGetMicGrant = (ipc: IpcMain, handler: () => MicGrantStatus | Promise<MicGrantStatus>) => {
  ipc.handle(TOPICS.GRANT.GET, async (): Promise<IpcResult<MicGrantStatus>> => {
    const result = await handler()
    const validated = v.safeParse(MicGrantStatusSchema, result)
    if (!validated.success) {
      return handleValidationError(validated.issues, result)
    }
    return { status: 'success', data: validated.output }
  })
}

export const registerPostMicGrant = (ipc: IpcMain, handler: () => Promise<MicGrantStatus>) => {
  ipc.handle(TOPICS.GRANT.POST, async (): Promise<IpcResult<MicGrantStatus>> => {
    const result = await handler()
    const validated = v.safeParse(MicGrantStatusSchema, result)
    if (!validated.success) {
      return handleValidationError(validated.issues, result)
    }
    return { status: 'success', data: validated.output }
  })
}

export const getMicGrant = async (ipc: IpcRenderer): Promise<IpcResult<MicGrantStatus>> => {
  const result = await ipc.invoke(TOPICS.GRANT.GET)
  const validated = v.safeParse(createIpcResultSchema(MicGrantStatusSchema), result)
  if (!validated.success) {
    return handleValidationError(validated.issues, result)
  }
  return validated.output
}

export const postMicGrant = async (ipc: IpcRenderer): Promise<IpcResult<MicGrantStatus>> => {
  const result = await ipc.invoke(TOPICS.GRANT.POST)
  const validated = v.safeParse(createIpcResultSchema(MicGrantStatusSchema), result)
  if (!validated.success) {
    return handleValidationError(validated.issues, result)
  }
  return validated.output
}

// Methods to be used by UI side.
// --
export const registerGetMicInUse = (ipc: IpcMain, handler: () => string | Promise<string | undefined>) => {
  ipc.handle(TOPICS.IN_USE.GET, async (): Promise<IpcResult<string | undefined>> => {
    const result = await handler()
    const validated = v.safeParse(v.union([MicIdSchema, v.undefined()]), result)
    if (!validated.success) {
      return handleValidationError(validated.issues, result)
    }
    return { status: 'success', data: validated.output }
  })
}

export const registerSetMicInUse = (ipc: IpcMain, handler: (id: string) => boolean | Promise<boolean>) => {
  ipc.handle(TOPICS.IN_USE.SET, async (_, id: unknown): Promise<IpcResult<boolean>> => {
    const validatedId = v.safeParse(MicIdSchema, id)
    if (!validatedId.success) {
      return handleValidationError(validatedId.issues, id)
    }
    const result = await handler(validatedId.output)
    return { status: 'success', data: result }
  })
}

export const getMicInUse = async (ipc: IpcRenderer): Promise<IpcResult<string>> => {
  const result = await ipc.invoke(TOPICS.IN_USE.GET)
  const validated = v.safeParse(createIpcResultSchema(MicIdSchema), result)
  if (!validated.success) {
    return handleValidationError(validated.issues, result)
  }
  return validated.output
}

export const setMicInUse = async (ipc: IpcRenderer, id: string): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.IN_USE.SET, id)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) {
    return handleValidationError(validated.issues, result)
  }
  return validated.output
}
