import type { IpcMain, IpcMainInvokeEvent } from 'electron'
import * as v from 'valibot'
import { createMainHandler, createRendererInvoker } from '../utils'

export const TOPICS = {
  LIST: 'models/list',
  DOWNLOAD: 'models/download',
  CANCEL_DOWNLOAD: 'models/download/cancel',
  DELETE: 'models/delete',
  SELECT: 'models/select',
} as const

const ModelSchema = v.object({
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
  language: v.optional(v.string()),
})

const ModelIdSchema = v.string()

export type Model = v.InferOutput<typeof ModelSchema>

export const registerListModels = (ipc: IpcMain, handler: () => Model[] | Promise<Model[]>) => {
  createMainHandler(ipc, TOPICS.LIST, [], handler)
}

export const registerDownloadModel = (
  ipc: IpcMain,
  handler: (event: IpcMainInvokeEvent, id: string) => Promise<void> | void,
) => {
  // Special case: we need the event arg which createMainHandler doesn't pass to the handler currently.
  // Actually, let's update createMainHandler to pass the event if needed, or just keep this one manual if it's rare.
  // In this project, only download handlers seem to need the event to send progress.
  ipc.handle(TOPICS.DOWNLOAD, async (event, id: unknown) => {
    const validatedId = v.safeParse(ModelIdSchema, id)
    if (!validatedId.success) {
      const messages = validatedId.issues.map((i) => i.message)
      return { status: 'error', data: messages }
    }
    await handler(event, validatedId.output)
    return { status: 'success', data: undefined }
  })
}

export const registerCancelDownloadModel = (ipc: IpcMain, handler: (id: string) => Promise<boolean> | boolean) => {
  createMainHandler(ipc, TOPICS.CANCEL_DOWNLOAD, [ModelIdSchema], handler)
}

export const registerDeleteModel = (ipc: IpcMain, handler: (id: string) => Promise<boolean> | boolean) => {
  createMainHandler(ipc, TOPICS.DELETE, [ModelIdSchema], handler)
}

export const registerSelectModel = (
  ipc: IpcMain,
  handler: (id: string, language: string) => Promise<boolean> | boolean,
) => {
  createMainHandler(ipc, TOPICS.SELECT, [ModelIdSchema, v.string()], handler)
}

// Methods to be used by UI side.
export const getListModels = createRendererInvoker<[], Model[]>(TOPICS.LIST, v.array(ModelSchema))
export const downloadModel = createRendererInvoker<[string], void>(TOPICS.DOWNLOAD, v.undefined())
export const cancelDownloadModel = createRendererInvoker<[string], boolean>(TOPICS.CANCEL_DOWNLOAD, v.boolean())
export const deleteModel = createRendererInvoker<[string], boolean>(TOPICS.DELETE, v.boolean())
export const selectModel = createRendererInvoker<[string, string], boolean>(TOPICS.SELECT, v.boolean())
