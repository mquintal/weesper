import { useMicSettings, useTranscribe } from '@open-bisbis/hooks'
import {
  listenForToggleRecording,
  pasteText,
  sendRecordingChunk,
  startRecording as startRecordingIpc,
} from '@open-bisbis/ipc'
import { useEffect, useRef, useState } from 'react'

export const useRecordingManager = () => {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve())
  const streamRef = useRef<MediaStream | null>(null)
  const isStartingRef = useRef(false)

  const toggleRecording = (shortcutId: string) => {
    if (transcribing) return
    if (isRecording) {
      setIsRecording(false)
      stopRecording(shortcutId)
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
      } catch (err) {
        console.warn('Failed to get preferred microphone, falling back to default:', err)
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

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          const chunkBlob = e.data
          sendQueueRef.current = sendQueueRef.current.then(async () => {
            try {
              const buffer = await chunkBlob.arrayBuffer()
              sendRecordingChunk(window.ipcRenderer, buffer)
            } catch (err) {
              console.error('Failed to send recording chunk:', err)
            }
          })
        }
      }

      mediaRecorder.start(500)
      setIsRecording(true)
    } catch (err) {
      console.error('Failed to start recording:', err)
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

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        track.enabled = false
      })
      streamRef.current = null
    }

    return new Promise<void>((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          // Wait for all remaining chunks to be processed and sent to IPC first
          await sendQueueRef.current

          const transcribed = await transcribe(shortcutId)

          if (transcribed) {
            await pasteText(window.ipcRenderer, transcribed)
          }

          console.log('Transcription result:', transcribed)
          resolve()
        } catch (err) {
          console.error('Error during transcription:', err)
          reject(err)
        }
      }

      mediaRecorder.stop()
    })
  }
  return { isRecording, stream: streamRef.current }
}
