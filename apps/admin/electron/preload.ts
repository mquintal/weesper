import { contextBridge, ipcRenderer } from 'electron'
import '@sentry/electron/preload'
import type { LogContext } from '@weesper/logger'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(channel: string, listener: (...args: any[]) => void) {
    ipcRenderer.on(channel, listener)
  },
  off(channel: string, listener: (...args: any[]) => void) {
    ipcRenderer.off(channel, listener)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

const processName = window.location.search.includes('mode=recording') ? 'widget' : 'renderer'

contextBridge.exposeInMainWorld('electron', {
  logger: {
    info: (message: string, context?: LogContext) =>
      ipcRenderer.send('logger:log', { level: 'info', process: processName, message, context }),
    warn: (message: string, context?: LogContext) =>
      ipcRenderer.send('logger:log', { level: 'warn', process: processName, message, context }),
    error: (message: string, context?: LogContext) =>
      ipcRenderer.send('logger:log', { level: 'error', process: processName, message, context }),
    debug: (message: string, context?: LogContext) =>
      ipcRenderer.send('logger:log', { level: 'debug', process: processName, message, context }),
  },
})
