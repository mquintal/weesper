import { shortcutsRepo } from '@electron/database'
import { app, type BrowserWindow, ipcMain, session } from 'electron'
import { createTray, createWidgetWindow, createWindow } from './components'
import {
  copyHandler,
  generalHandler,
  getSelectedModel,
  languagesHandler,
  llmsHandler,
  micHandler,
  modelsHandler,
  onboardingHandler,
  pasteHandler,
  recordingsHandler,
  shortcutsHandler,
  speechToTextHandler,
  updaterHandler,
} from './handlers'
import { services } from './services'
import { initAutoUpdater } from './services/auto-updater'

let win: BrowserWindow | null
let widgetWin: BrowserWindow | undefined

onboardingHandler(ipcMain)
recordingsHandler(ipcMain)
generalHandler(ipcMain)
copyHandler(ipcMain)
modelsHandler(ipcMain, async () => {
  await services.whisper.stop()
  return services.whisper.start()
})
llmsHandler(ipcMain, async () => {
  await services.llama.stop()
  await services.llama.start()
})
speechToTextHandler(ipcMain, {
  getWidgetWindow: () => widgetWin,
  getServices: () => services,
  getSelectdModel: () => getSelectedModel(),
})
languagesHandler(ipcMain)
micHandler(ipcMain)
pasteHandler(ipcMain)
const { registerShortcut, unregisterAllShortcuts, ensureDefaultShortcut } = shortcutsHandler(ipcMain, {
  getWindow: () => widgetWin,
})
updaterHandler(ipcMain)

app.on('will-quit', async () => {
  unregisterAllShortcuts()
  await services.llama.stop()
  await services.whisper.stop()
})

app.on('activate', async () => {
  if (process.platform === 'darwin') {
    await app.dock?.show()
  }

  if (!win || win.isDestroyed()) {
    win = createWindow()
  } else {
    win.show()
    win.focus()
  }
})

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    await app.dock?.show()
  }

  // Auto-approve microphone requests if system permission is already granted
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true)
    } else {
      callback(false)
    }
  })

  win = createWindow()
  createTray(win, () => {
    if (process.platform === 'darwin') {
      app.dock?.show()
    }
    if (!win || win.isDestroyed()) {
      win = createWindow()
    } else {
      win.show()
      win.focus()
    }
  })
  widgetWin = createWidgetWindow()

  await ensureDefaultShortcut()

  const activeShortcuts = await shortcutsRepo.list()

  activeShortcuts.forEach((row) => {
    registerShortcut(row.id, row.shortcut)
  })

  initAutoUpdater(() => win)

  await Promise.all([services.llama.start(), services.whisper.start()])
})
