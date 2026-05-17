import type { IpcMain } from 'electron'
import * as v from 'valibot'
import { createMainHandler, createRendererInvoker } from '../utils'

export const TOPICS = {
  LIST: 'languages/list',
} as const

const LanguageSchema = v.object({
  code: v.string(),
  language: v.string(),
})

export type Language = v.InferOutput<typeof LanguageSchema>

export const registerListLanguages = (ipc: IpcMain, handler: () => Promise<Language[]>) => {
  createMainHandler(ipc, TOPICS.LIST, [], handler)
}

export const getListLanguages = createRendererInvoker<[], Language[]>(TOPICS.LIST, v.array(LanguageSchema))
