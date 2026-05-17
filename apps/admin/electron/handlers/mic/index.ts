import { getMicGrant, getMicInUse, setMicGrant, setMicInUse } from '@open-bisbis/config'
import { registerGetMicGrant, registerGetMicInUse, registerPostMicGrant, registerSetMicInUse } from '@open-bisbis/ipc'
import { type IpcMain, systemPreferences } from 'electron'
import { resolvePermission } from './resolve-permission'

export const handler = (ipcMain: IpcMain) => {
  registerGetMicInUse(ipcMain, async () => {
    return getMicInUse()
  })

  registerSetMicInUse(ipcMain, (id) => {
    setMicInUse(id)
    return true
  })

  registerGetMicGrant(ipcMain, () => {
    return getMicGrant()
  })

  registerPostMicGrant(ipcMain, async () => {
    try {
      if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('microphone')

        const askResult =
          status === 'not-determined' ? await systemPreferences.askForMediaAccess('microphone') : undefined

        const finalStatus = resolvePermission(status, askResult)
        setMicGrant(finalStatus)
        return finalStatus
      }

      setMicGrant('granted')
      return 'granted'
    } catch (error) {
      console.error('Failed to request mic permission:', error)
      setMicGrant('denied')
      return 'denied'
    }
  })
}
