import type { IpcMain, IpcMainInvokeEvent, IpcRenderer } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from '../types'
import { createIpcResultSchema, handleValidationError, wrapIpcHandler } from '../utils'

export const TOPICS = {
  LIST: 'llms/list',
  DOWNLOAD: 'llms/download',
  CANCEL_DOWNLOAD: 'llms/download/cancel',
  DELETE: 'llms/delete',
  SELECT: 'llms/select',
} as const

const LlmSchema = v.object({
  id: v.string(),
  type: v.string(),
  url: v.string(),
  name: v.string(),
  size: v.number(),
  accuracy: v.number(),
  speed: v.number(),
  path: v.string(),
  hash: v.string(),
  isDownloaded: v.optional(v.boolean()),
  isSelected: v.optional(v.boolean()),
})

const LlmIdSchema = v.string()

export type Llm = v.InferOutput<typeof LlmSchema>

export const registerListLlms = (ipc: IpcMain, handler: () => Llm[] | Promise<Llm[]>) => {
  ipc.handle(
    TOPICS.LIST,
    wrapIpcHandler(TOPICS.LIST, async (): Promise<IpcResult<Llm[]>> => {
      const result = await handler()
      const validated = v.safeParse(v.array(LlmSchema), result)
      if (!validated.success) return handleValidationError(validated.issues, result)
      return { status: 'success', data: validated.output }
    }),
  )
}

export const registerDownloadLlm = (
  ipc: IpcMain,
  handler: (event: IpcMainInvokeEvent, id: string) => Promise<void> | void,
) => {
  ipc.handle(
    TOPICS.DOWNLOAD,
    wrapIpcHandler(TOPICS.DOWNLOAD, async (event, id: unknown): Promise<IpcResult<void>> => {
      const validatedId = v.safeParse(LlmIdSchema, id)
      if (!validatedId.success) return handleValidationError(validatedId.issues, id)
      await handler(event, validatedId.output)
      return { status: 'success', data: undefined }
    }),
  )
}

export const registerCancelDownloadLlm = (ipc: IpcMain, handler: (id: string) => Promise<boolean> | boolean) => {
  ipc.handle(
    TOPICS.CANCEL_DOWNLOAD,
    wrapIpcHandler(TOPICS.CANCEL_DOWNLOAD, async (_, id: unknown): Promise<IpcResult<boolean>> => {
      const validatedId = v.safeParse(LlmIdSchema, id)
      if (!validatedId.success) return handleValidationError(validatedId.issues, id)
      const result = await handler(validatedId.output)
      return { status: 'success', data: result }
    }),
  )
}

export const registerDeleteLlm = (ipc: IpcMain, handler: (id: string) => Promise<boolean> | boolean) => {
  ipc.handle(
    TOPICS.DELETE,
    wrapIpcHandler(TOPICS.DELETE, async (_, id: unknown): Promise<IpcResult<boolean>> => {
      const validatedId = v.safeParse(LlmIdSchema, id)
      if (!validatedId.success) return handleValidationError(validatedId.issues, id)
      const result = await handler(validatedId.output)
      return { status: 'success', data: result }
    }),
  )
}

export const registerSelectLlm = (ipc: IpcMain, handler: (id: string) => Promise<boolean> | boolean) => {
  ipc.handle(
    TOPICS.SELECT,
    wrapIpcHandler(TOPICS.SELECT, async (_, id: unknown): Promise<IpcResult<boolean>> => {
      const validatedId = v.safeParse(LlmIdSchema, id)
      if (!validatedId.success) return handleValidationError(validatedId.issues, id)
      const result = await handler(validatedId.output)
      return { status: 'success', data: result }
    }),
  )
}

// Methods to be used by UI side.
// --
export const getListLlms = async (ipc: IpcRenderer): Promise<IpcResult<Llm[]>> => {
  const result = await ipc.invoke(TOPICS.LIST)
  const validated = v.safeParse(createIpcResultSchema(v.array(LlmSchema)), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const downloadLlm = async (ipc: IpcRenderer, id: string): Promise<IpcResult<void>> => {
  const result = await ipc.invoke(TOPICS.DOWNLOAD, id)
  const validated = v.safeParse(createIpcResultSchema(v.undefined()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const cancelDownloadLlm = async (ipc: IpcRenderer, id: string): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.CANCEL_DOWNLOAD, id)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const deleteLlm = async (ipc: IpcRenderer, id: string): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.DELETE, id)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const selectLlm = async (ipc: IpcRenderer, id: string): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.SELECT, id)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}
