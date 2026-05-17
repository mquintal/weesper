import type { IpcMain, IpcRenderer } from 'electron'
import * as v from 'valibot'
import type { IpcResult } from '../types'
import { createIpcResultSchema, handleValidationError } from '../utils'

export const TOPICS = {
  START: 'recording/start',
  CHUNK: 'recording/chunk',
  STOP: 'recording/stop',
  PASTE_TEXT: 'paste-text', // This is also related to speech-to-text result
  COPY_TEXT: 'copy-text',
} as const

export const registerStartRecording = (ipc: IpcMain, handler: () => boolean | Promise<boolean>) => {
  ipc.handle(TOPICS.START, async (): Promise<IpcResult<boolean>> => {
    const result = await handler()
    return { status: 'success', data: result }
  })
}

export const registerStopRecording = (ipc: IpcMain, handler: (shortcutId: string) => Promise<string>) => {
  ipc.handle(TOPICS.STOP, async (_, shortcutId: unknown): Promise<IpcResult<string>> => {
    const validatedShortcutId = v.safeParse(v.string(), shortcutId)
    if (!validatedShortcutId.success) return handleValidationError(validatedShortcutId.issues, shortcutId)

    try {
      const result = await handler(validatedShortcutId.output)
      // We use loose validation because whisper output might have extra fields we don't care about,
      // but we only require what's in TranscriptionResultSchema
      return { status: 'success', data: result }
    } catch (err: any) {
      return { status: 'error', data: [err?.message || 'Failed to stop recording'] }
    }
  })
}

// Note: recording/chunk is sent via ipcRenderer.send, which is fire-and-forget.
// It's handled by ipcMain.on, not ipcMain.handle.
// There is no IpcResult for this.
export const registerRecordingChunk = (ipc: IpcMain, handler: (chunk: ArrayBuffer) => void) => {
  ipc.on(TOPICS.CHUNK, (_, chunk: unknown) => {
    if (chunk instanceof ArrayBuffer) {
      handler(chunk)
    }
  })
}

// Methods to be used by UI side.
// --
export const startRecording = async (ipc: IpcRenderer): Promise<IpcResult<boolean>> => {
  const result = await ipc.invoke(TOPICS.START)
  const validated = v.safeParse(createIpcResultSchema(v.boolean()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const stopRecording = async (ipc: IpcRenderer, shortcutId: string): Promise<IpcResult<string>> => {
  const result = await ipc.invoke(TOPICS.STOP, shortcutId)
  const validated = v.safeParse(createIpcResultSchema(v.string()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const registerPasteText = (ipc: IpcMain, handler: (text: string) => void | Promise<void>) => {
  ipc.handle(TOPICS.PASTE_TEXT, async (_, text: unknown): Promise<IpcResult<void>> => {
    const validatedText = v.safeParse(v.string(), text)
    if (!validatedText.success) return handleValidationError(validatedText.issues, text)

    try {
      await handler(validatedText.output)
      return { status: 'success', data: undefined }
    } catch (err: any) {
      return { status: 'error', data: [err?.message || 'Failed to paste text'] }
    }
  })
}

export const pasteText = async (ipc: IpcRenderer, text: string): Promise<IpcResult<void>> => {
  const result = await ipc.invoke(TOPICS.PASTE_TEXT, text)
  const validated = v.safeParse(createIpcResultSchema(v.undefined()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}

export const sendRecordingChunk = (ipc: IpcRenderer, chunk: ArrayBuffer): void => {
  ipc.send(TOPICS.CHUNK, chunk)
}

export const registerCopyText = (ipc: IpcMain, handler: (text: string) => void | Promise<void>) => {
  ipc.handle(TOPICS.COPY_TEXT, async (_, text: unknown): Promise<IpcResult<void>> => {
    const validatedText = v.safeParse(v.string(), text)
    if (!validatedText.success) return handleValidationError(validatedText.issues, text)
    await handler(validatedText.output)
    return { status: 'success', data: undefined }
  })
}

export const copyText = async (ipc: IpcRenderer, text: string): Promise<IpcResult<void>> => {
  const result = await ipc.invoke(TOPICS.COPY_TEXT, text)
  const validated = v.safeParse(createIpcResultSchema(v.undefined()), result)
  if (!validated.success) return handleValidationError(validated.issues, result)
  return validated.output
}
