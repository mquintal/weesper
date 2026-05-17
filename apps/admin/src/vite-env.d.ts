/// <reference types="vite/client" />

interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electron: {
    logger: import('@open-bisbis/logger').ILogger
  }
}
