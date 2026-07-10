import { useMicSettings } from '@weesper/hooks'
import {
  listenForStartRecording,
  listenForStopRecording,
  listenForToggleRecording,
  sendRecordingChunk,
  startRecording as startRecordingIpc,
  type WidgetStatus,
} from '@weesper/ipc'
import { logger } from '@weesper/logger'
import { useEffect, useRef, useState } from 'react'

export const useRecordingManager = (status: WidgetStatus) => {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve())
  const streamRef = useRef<MediaStream | null>(null)
  const isStartingRef = useRef(false)
  const startTimestampRef = useRef<number>(0)
  const chunkCountRef = useRef<number>(0)
  const chunkBytesRef = useRef<number>(0)

  const toggleRecording = (shortcutId: string) => {
    if (isRecording) {
      setIsRecording(false)
      stopRecording().catch((err) => {
        logger.error('[Recording Manager] Failed to stop recording', { error: err?.message || String(err) })
      })
    } else {
      startRecording(shortcutId)
    }
  }

  const toggleRef = useRef(toggleRecording)
  toggleRef.current = toggleRecording

  const startRef = useRef<(id: string) => void>(null!)
  const stopRef = useRef<(id: string) => Promise<void>>(null!)

  useEffect(() => {
    const unsubToggle = listenForToggleRecording(window.ipcRenderer, (shortcutId) => {
      toggleRef.current(shortcutId)
    })
    const unsubStart = listenForStartRecording(window.ipcRenderer, (shortcutId) => {
      startRef.current(shortcutId)
    })
    const unsubStop = listenForStopRecording(window.ipcRenderer, (shortcutId) => {
      stopRef.current(shortcutId).catch((err) => {
        logger.error('[Recording Manager] Failed to stop recording', { error: err?.message || String(err) })
      })
    })
    return () => {
      unsubToggle()
      unsubStart()
      unsubStop()
    }
  }, [])

  const { micInUse: selectedDeviceId } = useMicSettings()

  const startRecording = async (shortcutId: string) => {
    if (isStartingRef.current) return
    if (status === 'transcribing' || status === 'enhancing') return
    isStartingRef.current = true

    chunkCountRef.current = 0
    chunkBytesRef.current = 0

    try {
      if (streamRef.current) {
        for (const t of streamRef.current.getTracks()) t.stop()
        streamRef.current = null
      }

      const constraints = {
        audio: selectedDeviceId ? { deviceId: { ideal: selectedDeviceId } } : true,
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints)
      } catch (err: any) {
        logger.warn('Failed to get preferred microphone, falling back to default', {
          error: err?.message || String(err),
        })
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      }
      streamRef.current = stream

      // Start Electron side first
      const startResult = await startRecordingIpc(window.ipcRenderer, shortcutId)
      if (startResult.status === 'error') {
        throw new Error(startResult.data.join('\n'))
      }

      sendQueueRef.current = Promise.resolve()
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })
      mediaRecorderRef.current = mediaRecorder

      // Diagnostic logging for audio tracks to debug microphone permission issues
      const tracks = stream.getAudioTracks()
      const trackDiagnostics = tracks.map((t) => ({
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted,
        settings: t.getSettings ? t.getSettings() : {},
      }))

      logger.info('[Media Stream Diagnostics]', {
        tracks: JSON.stringify(trackDiagnostics),
        selectedDeviceId: selectedDeviceId || 'default',
      })

      mediaRecorder.onerror = (e: any) => {
        logger.error('[MediaRecorder Error]', { error: e.error?.message || String(e) })
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          const chunkBlob = e.data
          chunkCountRef.current += 1
          chunkBytesRef.current += chunkBlob.size

          logger.debug(`[MediaRecorder Chunk] Emitting chunk ${chunkCountRef.current}`, { size: chunkBlob.size })

          sendQueueRef.current = sendQueueRef.current.then(async () => {
            try {
              const buffer = await chunkBlob.arrayBuffer()
              sendRecordingChunk(window.ipcRenderer, buffer)
            } catch (err: any) {
              logger.error('Failed to send recording chunk', { error: err?.message || String(err) })
            }
          })
        } else {
          logger.warn('[MediaRecorder Chunk] Emitted empty chunk (size 0)')
        }
      }

      mediaRecorder.start(1000)
      startTimestampRef.current = Date.now()
      setIsRecording(true)

      logger.info('[MediaRecorder] Started')
    } catch (err: any) {
      logger.error('Failed to start recording', { error: err?.message || String(err) })
      setIsRecording(false)
    } finally {
      isStartingRef.current = false
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return

    const mediaRecorder = mediaRecorderRef.current
    mediaRecorderRef.current = null
    setIsRecording(false)

    logger.info('[MediaRecorder] Stop triggered', {
      totalChunksGenerated: chunkCountRef.current,
      totalBytesGenerated: chunkBytesRef.current,
    })

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        track.enabled = false
      })
      streamRef.current = null
    }

    const duration = Date.now() - startTimestampRef.current
    if (duration < 500) {
      logger.warn('[Recording Manager] Recording was too short, skipping transcription', { durationMs: duration })
      // Tell the main process we finished so it can clean up FFmpeg and exit gracefully
      sendRecordingChunk(window.ipcRenderer, null)
      return
    }

    return new Promise<void>((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          // Wait for all remaining chunks to be processed and sent to IPC first
          await sendQueueRef.current
          // this will signal the end of the stream to the main process stream handler.
          sendRecordingChunk(window.ipcRenderer, null)

          logger.info('[MediaRecorder] Data all sent', {
            totalChunksGenerated: chunkCountRef.current,
            totalBytesGenerated: chunkBytesRef.current,
          })

          resolve()
        } catch (err: any) {
          logger.error('Error during stopping recording', { error: err?.message || String(err) })
          reject(err)
        }
      }

      mediaRecorder.stop()
    })
  }

  startRef.current = startRecording
  stopRef.current = stopRecording

  return { isRecording, stream: streamRef.current }
}
