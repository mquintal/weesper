import {
  checkForUpdate,
  downloadUpdate,
  installUpdate,
  listenForUpdateProgress,
  listenForUpdateStatus,
  type UpdateProgress,
  type UpdateStatus,
} from '@open-bisbis/ipc'
import { logger } from '@open-bisbis/logger'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

export const useUpdateStatus = () => {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })

  useEffect(() => {
    const unsubscribe = listenForUpdateStatus(window.ipcRenderer, (data) => {
      setStatus(data)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return status
}

export const useUpdateProgress = () => {
  const [progress, setProgress] = useState<UpdateProgress | null>(null)

  useEffect(() => {
    const unsubscribe = listenForUpdateProgress(window.ipcRenderer, (data) => {
      setProgress(data)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  return progress
}

export const useCheckForUpdate = () => {
  return useMutation({
    mutationFn: async () => {
      const result = await checkForUpdate(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useCheckForUpdate] Error checking for updates', { error: errorMsg })
        throw new Error(errorMsg)
      }
    },
  })
}

export const useDownloadUpdate = () => {
  return useMutation({
    mutationFn: async () => {
      const result = await downloadUpdate(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useDownloadUpdate] Error downloading update', { error: errorMsg })
        throw new Error(errorMsg)
      }
    },
  })
}

export const useInstallUpdate = () => {
  return useMutation({
    mutationFn: async () => {
      const result = await installUpdate(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useInstallUpdate] Error installing update', { error: errorMsg })
        throw new Error(errorMsg)
      }
    },
  })
}
