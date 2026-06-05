import { useMicSettings, useTranscribe } from '@weesper/hooks'
import {
  listenForToggleRecording,
  pasteText,
  sendRecordingChunk,
  startRecording as startRecordingIpc,
} from '@weesper/ipc'
import { logger } from '@weesper/logger'
import { useEffect, useRef, useState } from 'react'

export const useRecordingManager = () => {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve())
  const streamRef = useRef<MediaStream | null>(null)
  const isStartingRef = useRef(false)
  const startTimestampRef = useRef<number>(0)
  const chunkCountRef = useRef<number>(0)
  const chunkBytesRef = useRef<number>(0)

  const toggleRecording = (shortcutId: string) => {
    if (transcribing) return
    if (isRecording) {
      setIsRecording(false)
      stopRecording(shortcutId).catch((err) => {
        logger.error('[Recording Manager] Failed to stop recording', { error: err?.message || String(err) })
      })
    } else {
      startRecording()
    }
  }

  const toggleRef = useRef(toggleRecording)
  toggleRef.current = toggleRecording

  useEffect(() => {
    const unsubscribe = listenForToggleRecording(window.ipcRenderer, (shortcutId) => {
      toggleRef.current(shortcutId)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const { micInUse: selectedDeviceId } = useMicSettings()
  const { transcribe, transcribing } = useTranscribe()

  const startRecording = async () => {
    if (isStartingRef.current) return
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
      const startResult = await startRecordingIpc(window.ipcRenderer)
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

      mediaRecorder.start(500)
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

  const stopRecording = async (shortcutId: string) => {
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
      await transcribe(shortcutId).catch(() => {})
      return
    }

    return new Promise<void>((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          // Wait for all remaining chunks to be processed and sent to IPC first
          await sendQueueRef.current

          logger.info('[MediaRecorder] Data all sent, requesting transcription', {
            totalChunksGenerated: chunkCountRef.current,
            totalBytesGenerated: chunkBytesRef.current,
          })

          const transcribed = await transcribe(shortcutId)

          if (transcribed) {
            await pasteText(window.ipcRenderer, transcribed)
          }

          logger.info('Transcription result complete', { textLength: transcribed?.length || 0 })
          resolve()
        } catch (err: any) {
          logger.error('Error during transcription', { error: err?.message || String(err) })
          reject(err)
        }
      }

      mediaRecorder.stop()
    })
  }
  return { isRecording, stream: streamRef.current }
}
