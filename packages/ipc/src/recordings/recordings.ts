import type { Recording as DbRecording } from '@open-bisbis/database'
import type { IpcMain, IpcRenderer } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from '../types'
import { createIpcResultSchema, handleValidationError, wrapIpcHandler } from '../utils'

export const TOPICS = {
  LIST: 'recordings/list',
  GET: 'recordings/get',
  DELETE: 'recordings/delete',
  GET_AUDIO: 'recordings/audio',
} as const

const RecordingSchema = v.object({
  id: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  duration: v.number(),
  audioFilePath: v.string(),
  transcribedText: v.nullable(v.string()),
  enhancedText: v.nullable(v.string()),
  shortcutVersionId: v.string(),
  modelId: v.string(),
  llmId: v.nullable(v.string()),
}) satisfies v.GenericSchema<DbRecording>

export type Recording = DbRecording

export const registerListRecordings = (ipc: IpcMain, handler: () => Recording[] | Promise<Recording[]>) => {
  ipc.handle(
    TOPICS.LIST,
    wrapIpcHandler(TOPICS.LIST, async (): Promise<IpcResult<Recording[]>> => {
      const result = await handler()
      const validated = v.safeParse(v.array(RecordingSchema), result)
      if (!validated.success) return handleValidationError(validated.issues, result)
      return { status: 'success', data: validated.output }
    }),
  )
}

export const registerGetRecording = (
  ipc: IpcMain,
  handler: (id: string) => Recording | undefined | Promise<Recording | undefined>,
) => {
  ipc.handle(
    TOPICS.GET,
    wrapIpcHandler(TOPICS.GET, async (_, id: unknown): Promise<IpcResult<Recording | undefined>> => {
      const validatedId = v.safeParse(v.string(), id)
      if (!validatedId.success) return handleValidationError(validatedId.issues, id)
      const result = await handler(validatedId.output)
      if (result === undefined) return { status: 'success', data: undefined }
      const validatedResult = v.safeParse(RecordingSchema, result)
      if (!validatedResult.success) return handleValidationError(validatedResult.issues, result)
      return { status: 'success', data: validatedResult.output }
    }),
  )
}

export const registerDeleteRecording = (ipc: IpcMain, handler: (id: string) => Promise<boolean> | boolean) => {
  ipc.handle(
    TOPICS.DELETE,
    wrapIpcHandler(TOPICS.DELETE, async (_, id: unknown): Promise<IpcResult<boolean>> => {
      const validatedId = v.safeParse(v.string(), id)
      if (!validatedId.success) return handleValidationError(validatedId.issues, id)
      const result = await handler(validatedId.output)
      return { status: 'success', data: result }
    }),
  )
}

// Methods to be used by UI side
export const getListRecordings = async (ipc: IpcRenderer): Promise<IpcResult<Recording[]>> => {
  const result = await ipc.invoke(TOPICS.LIST)
  const validated = v.safeParse(createIpcResultSchema(v.array(RecordingSchema)), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const getRecording = async (ipc: IpcRenderer, id: string): Promise<IpcResult<Recording | undefined>> => {
  const result = await ipc.invoke(TOPICS.GET, id)
  const validated = v.safeParse(createIpcResultSchema(RecordingSchema), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const deleteRecording = async (ipc: IpcRenderer, id: string): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.DELETE, id)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const registerGetRecordingAudio = (
  ipc: IpcMain,
  handler: (id: string) => Promise<Uint8Array | null> | Uint8Array | null,
) => {
  ipc.handle(
    TOPICS.GET_AUDIO,
    wrapIpcHandler(TOPICS.GET_AUDIO, async (_, id: unknown): Promise<IpcResult<Uint8Array | null>> => {
      const validatedId = v.safeParse(v.string(), id)
      if (!validatedId.success) return handleValidationError(validatedId.issues, id)
      const result = await handler(validatedId.output)
      return { status: 'success', data: result }
    }),
  )
}

export const getRecordingAudio = async (ipc: IpcRenderer, id: string): Promise<Uint8Array | null> => {
  const result = await ipc.invoke(TOPICS.GET_AUDIO, id)
  if (result?.status === 'error') return null
  return result?.data ? new Uint8Array(result.data) : null
}
