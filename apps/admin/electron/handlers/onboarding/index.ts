import { isOnboarded, setIsOnboarded } from '@open-bisbis/config'
import {
  registerGetAccessibilityGrant,
  registerGetOnboarded,
  registerPostAccessibilityGrant,
  registerPostOnboarded,
} from '@open-bisbis/ipc'
import { logger } from '@open-bisbis/logger'
import { type IpcMain, systemPreferences } from 'electron'

export const handler = (ipcMain: IpcMain) => {
  registerGetOnboarded(ipcMain, () => {
    return isOnboarded()
  })

  registerPostOnboarded(ipcMain, async () => {
    try {
      setIsOnboarded()
      logger.info('Onboarded')
      return true
    } catch (e) {
      logger.error('Failed to set onboarded:', { error: String(e) })
      return false
    }
  })

  registerGetAccessibilityGrant(ipcMain, async () => {
    if (process.platform !== 'darwin') return true
    return systemPreferences.isTrustedAccessibilityClient(false)
  })

  registerPostAccessibilityGrant(ipcMain, async () => {
    if (process.platform !== 'darwin') return true
    return systemPreferences.isTrustedAccessibilityClient(true)
  })
}
