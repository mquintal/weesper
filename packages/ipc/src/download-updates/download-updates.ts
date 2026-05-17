import type { IpcMainInvokeEvent, IpcRenderer, IpcRendererEvent } from 'electron'
import * as v from 'valibot'

export const TOPICS = {
  PROGRESS: 'download/progress',
}

const DownloadStateSchema = v.object({
  id: v.string(),
  percentage: v.number(),
  state: v.union([v.literal('progress'), v.literal('finished'), v.literal('error')]),
})

export type DownloadState = v.InferOutput<typeof DownloadStateSchema>

export const updateDownloadProgress = (event: IpcMainInvokeEvent, data: DownloadState) =>
  event.sender.send(TOPICS.PROGRESS, data)

export const listenForDownloadProgress = (ipc: IpcRenderer, handler: (data: DownloadState) => void) => {
  const onHandler = (_event: IpcRendererEvent, data: any) => {
    const validated = v.safeParse(DownloadStateSchema, data)
    if (!validated.success) {
      console.error(`Failed to update download progress:`, validated.issues)
    } else {
      handler(validated.output)
    }
  }
  ipc.on(TOPICS.PROGRESS, onHandler)
  return () => ipc.off(TOPICS.PROGRESS, onHandler)
}
