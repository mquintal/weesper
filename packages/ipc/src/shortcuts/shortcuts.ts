import type { Shortcut as DbShortcut } from '@open-bisbis/database'
import { logger } from '@open-bisbis/logger'
import type { BrowserWindow, IpcMain, IpcRenderer, IpcRendererEvent } from 'electron'
import * as v from 'valibot'
import { createMainHandler, createRendererInvoker } from '../utils'

export const TOPICS = {
  DEFAULT_GET: 'shortcuts/default/get',
  DEFAULT_SET: 'shortcuts/default/set',
  LIST: 'shortcuts/list',
  CREATE: 'shortcuts/create',
  UPDATE: 'shortcuts/update',
  DELETE: 'shortcuts/delete',
  TOGGLE: 'toggle-recording',
} as const

const ShortcutSchema = v.object({
  id: v.string(),
  name: v.string(),
  shortcut: v.string(),
  prompt: v.string(),
  shortcutId: v.string(),
  version: v.number(),
  createdAt: v.string(),
}) satisfies v.GenericSchema<DbShortcut>

const CreateShortcutSchema = v.object({
  name: v.string(),
  shortcut: v.string(),
  prompt: v.string(),
}) satisfies v.GenericSchema<Omit<DbShortcut, 'id' | 'createdAt' | 'shortcutId' | 'version'>>

export type CreateShortcut = v.InferOutput<typeof CreateShortcutSchema>
export type Shortcut = DbShortcut

export const registerGetDefaultShortcut = (ipc: IpcMain, handler: () => string | Promise<string>) => {
  createMainHandler(ipc, TOPICS.DEFAULT_GET, [], handler)
}

export const registerSetDefaultShortcut = (ipc: IpcMain, handler: (shortcut: string) => boolean | Promise<boolean>) => {
  createMainHandler(ipc, TOPICS.DEFAULT_SET, [v.string()], handler)
}

export const registerListShortcuts = (ipc: IpcMain, handler: () => Shortcut[] | Promise<Shortcut[]>) => {
  createMainHandler(ipc, TOPICS.LIST, [], handler)
}

export const registerCreateShortcut = (
  ipc: IpcMain,
  handler: (shortcut: CreateShortcut) => boolean | Promise<boolean>,
) => {
  createMainHandler(ipc, TOPICS.CREATE, [CreateShortcutSchema], handler)
}

export const registerUpdateShortcut = (
  ipc: IpcMain,
  handler: (id: string, shortcut: CreateShortcut) => boolean | Promise<boolean>,
) => {
  createMainHandler(ipc, TOPICS.UPDATE, [v.string(), CreateShortcutSchema], handler)
}

export const registerDeleteShortcut = (ipc: IpcMain, handler: (id: string) => boolean | Promise<boolean>) => {
  createMainHandler(ipc, TOPICS.DELETE, [v.string()], handler)
}

export const sendToggleRecording = (window: BrowserWindow | null | undefined, shortcutName: string) => {
  window?.webContents.send(TOPICS.TOGGLE, shortcutName)
}

// Methods to be used by UI side.
export const getDefaultShortcut = createRendererInvoker<[], string>(TOPICS.DEFAULT_GET, v.string())
export const setDefaultShortcut = createRendererInvoker<[string], boolean>(TOPICS.DEFAULT_SET, v.boolean())
export const getListShortcuts = createRendererInvoker<[], Shortcut[]>(TOPICS.LIST, v.array(ShortcutSchema))
export const createShortcut = createRendererInvoker<[CreateShortcut], boolean>(TOPICS.CREATE, v.boolean())
export const updateShortcut = createRendererInvoker<[string, CreateShortcut], boolean>(TOPICS.UPDATE, v.boolean())
export const deleteShortcut = createRendererInvoker<[string], boolean>(TOPICS.DELETE, v.boolean())

export const listenForToggleRecording = (ipc: IpcRenderer, handler: (shortcutName: string) => void) => {
  const onHandler = (_event: IpcRendererEvent, data: unknown) => {
    const validated = v.safeParse(v.string(), data)
    if (!validated.success) {
      logger.error(`Failed to toggle recording:`, { errors: validated.issues.map((i) => i.message).join(', ') })
    } else {
      handler(validated.output)
    }
  }
  ipc.on(TOPICS.TOGGLE, onHandler)
  return () => ipc.off(TOPICS.TOGGLE, onHandler)
}
