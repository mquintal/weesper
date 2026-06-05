/// <reference types="vite/client" />

interface Window {
  ipcRenderer: import('electron').IpcRenderer
  electron: {
    logger: import('@weesper/logger').ILogger
  }
}
