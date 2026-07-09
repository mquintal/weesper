import { shortcutsRepo } from '@electron/database'
import { getShortcutMode } from '@weesper/config'
import { sendStartRecording, sendStopRecording } from '@weesper/ipc'
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
  recordingsHandler,
  shortcutsHandler,
  speechToTextHandler,
  updaterHandler,
} from './handlers'
import { services } from './services'
import { GlobalHookService } from './utils/global-hook'

let win: BrowserWindow | null
let widgetWin: BrowserWindow | undefined

const hookService = new GlobalHookService({
  getWindow: () => widgetWin,
  sendStartRecording,
  sendStopRecording,
})

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
  getSelectedModel: () => getSelectedModel(),
})
languagesHandler(ipcMain)
micHandler(ipcMain)
const { registerShortcut, unregisterAllShortcuts, ensureDefaultShortcut } = shortcutsHandler(ipcMain, {
  getWindow: () => widgetWin,
  hookService,
})
updaterHandler(ipcMain)

app.on('will-quit', async () => {
  unregisterAllShortcuts()
  hookService.stop()
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

  app.setAboutPanelOptions({
    copyright: '',
  })

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

  const mode = getShortcutMode()

  if (mode === 'hold') {
    hookService.start()
  }

  const activeShortcuts = await shortcutsRepo.list()

  activeShortcuts.forEach((row) => {
    registerShortcut(row.id, row.shortcut, mode)
  })

  services.updater.init(() => win)

  await Promise.all([services.llama.start(), services.whisper.start()])
})
