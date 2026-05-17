import { type DownloadState, listenForDownloadProgress } from '@open-bisbis/ipc'
import { useEffect, useRef, useState } from 'react'

export const useDownload = (id: string, onFinish: () => void) => {
  const [downloadProgress, setDownloadProgress] = useState<number>(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleProgress = (data: DownloadState) => {
    if (data.id === id) {
      setDownloadProgress(data.percentage)
      if (data.state === 'progress') {
        setIsDownloading(true)
      } else if (data.state === 'finished') {
        setIsDownloading(false)
        setDownloadProgress(0)
        onFinish()
      } else if (data.state === 'error') {
        setIsDownloading(false)
        setDownloadProgress(0)
      }
    }
  }

  const ref = useRef(handleProgress)
  ref.current = handleProgress

  useEffect(() => {
    const unsubscribe = listenForDownloadProgress(window.ipcRenderer, (data) => {
      ref.current(data)
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    isDownloading,
    progress: downloadProgress,
    start: () => {
      setIsDownloading(true)
      setDownloadProgress(0)
    },
    stop: () => {
      setIsDownloading(false)
      setDownloadProgress(0)
    },
  }
}
