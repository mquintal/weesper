import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { app, BrowserWindow } from 'electron'
import { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL } from '../config'

export function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    icon: path.join(process.env.VITE_PUBLIC, 'logo.png'),
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.js'),
      webSecurity: true,
    },
  })

  win.on('close', () => {
    if (process.platform === 'darwin') {
      app.dock?.hide()
    }
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadURL(pathToFileURL(path.join(RENDERER_DIST, 'index.html')).href)
  }
  return win
}
