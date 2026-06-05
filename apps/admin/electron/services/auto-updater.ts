import { sendDownloadProgress, sendStatus as sendUpdateStatus } from '@weesper/ipc'
import { logger } from '@weesper/logger'
import { app, type BrowserWindow, Menu, MenuItem } from 'electron'
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater'

type WindowGetter = () => BrowserWindow | undefined | null

export const initAutoUpdater = (getWindow: WindowGetter) => {
  // autoUpdater runs in the main process.
  // It handles the full update lifecycle: checking, downloading, and installing.

  autoUpdater.logger = {
    info: (msg) => logger.info(`[AutoUpdater] ${msg}`),
    warn: (msg) => logger.warn(`[AutoUpdater] ${msg}`),
    error: (msg) => logger.error(`[AutoUpdater] ${msg}`),
    debug: (msg) => logger.debug(`[AutoUpdater] ${msg}`),
  }

  // We want it to auto-download so it happens in the background.
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = true // enabled for testing alpha versions

  // When not packaged (e.g. running locally in dev mode), the update check will fail by default.
  // We simply bypass checking in dev mode entirely.

  const sendStatus = (
    state: 'checking' | 'available' | 'up-to-date' | 'downloading' | 'downloaded' | 'error',
    data?: any,
  ) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      sendUpdateStatus(win, { state, ...data })
    }
  }

  const sendProgress = (progress: ProgressInfo) => {
    const win = getWindow()
    if (win && !win.isDestroyed()) {
      sendDownloadProgress(win, {
        percent: progress.percent,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      })
    }
  }

  autoUpdater.on('checking-for-update', () => {
    sendStatus('checking')
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    sendStatus('available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
    })
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    sendStatus('up-to-date', { version: info.version })
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    sendStatus('downloading')
    sendProgress(progress)
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    sendStatus('downloaded', { version: info.version })

    if (process.platform === 'darwin') {
      const appMenu = Menu.getApplicationMenu()
      if (appMenu) {
        const firstMenu = appMenu.items[0]?.submenu
        if (firstMenu) {
          const exists = firstMenu.items.some((item) => item.label === 'Restart to Update')
          if (!exists) {
            firstMenu.insert(
              1,
              new MenuItem({
                label: 'Restart to Update',
                click: () => {
                  autoUpdater.quitAndInstall()
                },
              }),
            )
            firstMenu.insert(2, new MenuItem({ type: 'separator' }))
            Menu.setApplicationMenu(appMenu)
          }
        }
      }
    }
  })

  autoUpdater.on('error', (err: Error) => {
    sendStatus('error', { error: err.message })
  })

  // Start checking shortly after launch
  setTimeout(() => {
    if (app.isPackaged) {
      autoUpdater
        .checkForUpdates()
        .catch((err) => logger.error('[AutoUpdater] initial check failed', { error: err.message }))
    }
  }, 30000)

  setInterval(
    () => {
      if (app.isPackaged) {
        autoUpdater
          .checkForUpdates()
          .catch((err) => logger.error('[AutoUpdater] periodic check failed', { error: err.message }))
      }
    },
    1 * 60 * 60 * 1000, // 1 hour
  )
}

export const checkForUpdates = async () => {
  if (!app.isPackaged) {
    logger.info('[AutoUpdater] Skipping update check in development mode.')
    return null
  }
  return autoUpdater.checkForUpdates()
}

export const downloadUpdate = () => {
  return autoUpdater.downloadUpdate()
}

export const installUpdate = () => {
  autoUpdater.quitAndInstall()
}
