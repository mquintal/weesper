import type { IpcMain, IpcRenderer, IpcRendererEvent } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from '../types'
import { createIpcResultSchema, handleValidationError, wrapIpcHandler } from '../utils'

const TOPICS = {
  CHECK: 'updater/check',
  DOWNLOAD: 'updater/download',
  INSTALL: 'updater/install',
  STATUS: 'updater/status',
  PROGRESS: 'updater/progress',
} as const

const UpdateStateSchema = v.union([
  v.literal('idle'),
  v.literal('checking'),
  v.literal('available'),
  v.literal('up-to-date'),
  v.literal('downloading'),
  v.literal('downloaded'),
  v.literal('error'),
])

const UpdateStatusSchema = v.object({
  state: UpdateStateSchema,
  version: v.optional(v.string()),
  releaseNotes: v.optional(v.string()),
  releaseDate: v.optional(v.string()),
  error: v.optional(v.string()),
})

const UpdateProgressSchema = v.object({
  percent: v.number(),
  bytesPerSecond: v.number(),
  transferred: v.number(),
  total: v.number(),
})

export type UpdateState = v.InferOutput<typeof UpdateStateSchema>
export type UpdateStatus = v.InferOutput<typeof UpdateStatusSchema>
export type UpdateProgress = v.InferOutput<typeof UpdateProgressSchema>

// --- Main Process Handlers ---

export const registerCheckForUpdate = (ipc: IpcMain, handler: () => void | Promise<void>) => {
  ipc.handle(
    TOPICS.CHECK,
    wrapIpcHandler(TOPICS.CHECK, async (): Promise<IpcResult<void>> => {
      await handler()
      return { status: 'success', data: undefined }
    }),
  )
}

export const registerDownloadUpdate = (ipc: IpcMain, handler: () => void | Promise<void>) => {
  ipc.handle(
    TOPICS.DOWNLOAD,
    wrapIpcHandler(TOPICS.DOWNLOAD, async (): Promise<IpcResult<void>> => {
      await handler()
      return { status: 'success', data: undefined }
    }),
  )
}

export const registerInstallUpdate = (ipc: IpcMain, handler: () => void | Promise<void>) => {
  ipc.handle(
    TOPICS.INSTALL,
    wrapIpcHandler(TOPICS.INSTALL, async (): Promise<IpcResult<void>> => {
      await handler()
      return { status: 'success', data: undefined }
    }),
  )
}

// --- Renderer Process Invokers ---

export const checkForUpdate = async (ipc: IpcRenderer): Promise<IpcResult<void>> => {
  const result = await ipc.invoke(TOPICS.CHECK)
  const validated = v.safeParse(createIpcResultSchema(v.any()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const downloadUpdate = async (ipc: IpcRenderer): Promise<IpcResult<void>> => {
  const result = await ipc.invoke(TOPICS.DOWNLOAD)
  const validated = v.safeParse(createIpcResultSchema(v.any()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const installUpdate = async (ipc: IpcRenderer): Promise<IpcResult<void>> => {
  const result = await ipc.invoke(TOPICS.INSTALL)
  const validated = v.safeParse(createIpcResultSchema(v.any()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

// --- Listeners ---

export const listenForUpdateStatus = (ipc: IpcRenderer, handler: (data: UpdateStatus) => void) => {
  const onHandler = (_event: IpcRendererEvent, data: any) => {
    const validated = v.safeParse(UpdateStatusSchema, data)
    if (!validated.success) {
      console.error(`Failed to parse update status:`, validated.issues)
    } else {
      handler(validated.output)
    }
  }
  ipc.on(TOPICS.STATUS, onHandler)
  return () => ipc.off(TOPICS.STATUS, onHandler)
}

export const listenForUpdateProgress = (ipc: IpcRenderer, handler: (data: UpdateProgress) => void) => {
  const onHandler = (_event: IpcRendererEvent, data: any) => {
    const validated = v.safeParse(UpdateProgressSchema, data)
    if (!validated.success) {
      console.error(`Failed to parse update progress:`, validated.issues)
    } else {
      handler(validated.output)
    }
  }
  ipc.on(TOPICS.PROGRESS, onHandler)
  return () => ipc.off(TOPICS.PROGRESS, onHandler)
}
