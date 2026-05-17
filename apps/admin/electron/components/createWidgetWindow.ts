import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { BrowserWindow, screen } from 'electron'
import { MAIN_DIST, RENDERER_DIST, VITE_DEV_SERVER_URL } from '../config'

export function createWidgetWindow() {
  const win = new BrowserWindow({
    width: 170,
    height: 40,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    type: 'panel', // Critical for macOS to behave like an overlay
    webPreferences: {
      preload: path.join(MAIN_DIST, 'preload.js'),
    },
  })

  win.setIgnoreMouseEvents(true)
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  win.setAlwaysOnTop(true, 'screen-saver')

  // Skip taskbar
  win.setSkipTaskbar(true)

  // Center top position
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width } = primaryDisplay.workAreaSize
  win.setPosition(Math.floor((width - 170) / 2), 40)

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}?mode=recording`)
  } else {
    win.loadURL(`${pathToFileURL(path.join(RENDERER_DIST, 'index.html')).href}?mode=recording`)
  }

  return win
}
