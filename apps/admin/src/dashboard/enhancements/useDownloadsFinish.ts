import { type DownloadState, listenForDownloadProgress } from '@open-bisbis/ipc'
import { useEffect } from 'react'

export const useDownloadsFinish = (onFinish: () => void) => {
  useEffect(() => {
    const onDownloadProgress = (data: DownloadState) => {
      if (data.state === 'finished') {
        onFinish()
      }
    }
    const unsubscribe = listenForDownloadProgress(window.ipcRenderer, onDownloadProgress)

    return () => {
      unsubscribe()
    }
  }, [onFinish])
}
