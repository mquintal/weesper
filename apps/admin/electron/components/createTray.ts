import path from 'node:path'
import { type BrowserWindow, Menu, nativeImage, Tray } from 'electron'

export function createTray(win: BrowserWindow, createWindow: () => void) {
  const iconPath = path.join(process.env.VITE_PUBLIC, 'logo-white.png')
  let icon = nativeImage.createFromPath(iconPath)
  icon = icon.resize({ width: 20, height: 20 })
  icon.setTemplateImage(true)

  const tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'OpenBisbis',
      click: () => {
        try {
          if (win) {
            if (win.isMinimized()) win.restore()
            win.focus()
          } else {
            createWindow()
          }
        } catch {
          createWindow()
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit OpenBisbis',
      type: 'normal',
      role: 'quit',
    },
  ])

  tray.setToolTip('OpenBisbis')
  tray.setContextMenu(contextMenu)

  return tray
}
