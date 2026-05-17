import type { BrowserWindow, IpcRenderer } from 'electron'

export const TOPICS = {
  STATUS: 'widget/status',
  BEFORE_HIDE: 'widget/before-hide',
} as const

export type WidgetStatus = 'recording' | 'transcribing' | 'enhancing' | 'error' | 'finished'

export const updateWidgetStatus = (win: BrowserWindow | undefined, status: WidgetStatus) => {
  win?.webContents.send(TOPICS.STATUS, status)
}

export const widgetWindowWillHide = (win: BrowserWindow | undefined) => {
  win?.webContents.send(TOPICS.BEFORE_HIDE)
}

export const listenToWidgetStatus = (ipc: IpcRenderer, handler: (status: WidgetStatus) => void) => {
  const listener = (_: any, status: any) => {
    handler(status as WidgetStatus)
  }
  ipc.on(TOPICS.STATUS, listener)
  return () => {
    ipc.off(TOPICS.STATUS, listener)
  }
}

export const listenToWidgetWillHide = (ipc: IpcRenderer, handler: () => void) => {
  const listener = () => {
    handler()
  }
  ipc.on(TOPICS.BEFORE_HIDE, listener)
  return () => {
    ipc.off(TOPICS.BEFORE_HIDE, listener)
  }
}
