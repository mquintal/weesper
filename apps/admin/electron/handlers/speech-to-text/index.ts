import { shortcutsRepo } from '@electron/database'
import type { Model } from '@open-bisbis/ipc'
import {
  registerRecordingChunk,
  registerStartRecording,
  registerStopRecording,
  updateWidgetStatus,
  widgetWindowWillHide,
} from '@open-bisbis/ipc'
import type { BrowserWindow, IpcMain } from 'electron'
import { cleanText } from './clean-text'
import { processAudio } from './process-audio'
import { createRecording, updateEnhancedText, updateTranscription } from './recordings'

type options = {
  getWidgetWindow: () => BrowserWindow | undefined
  getSelectdModel: () => Model | undefined
  getServices: () => {
    llama: { request: (text: string, prompt: string) => Promise<string> }
    whisper: { request: (wav: Buffer) => Promise<string> }
  }
}

export const handler = (ipcMain: IpcMain, options: options) => {
  const { writeChunk, getAudioBuffer, start } = processAudio()
  registerStartRecording(ipcMain, async () => {
    try {
      const win = options.getWidgetWindow()
      win?.showInactive()
      updateWidgetStatus(win, 'recording')
      start()
      return true
    } catch (err) {
      console.error('Failed to start recording:', err)
      updateWidgetStatus(options.getWidgetWindow(), 'error')
      return false
    }
  })

  registerRecordingChunk(ipcMain, (chunk: ArrayBuffer) => {
    writeChunk(chunk)
  })

  registerStopRecording(ipcMain, async (shortcutId: string) => {
    const win = options.getWidgetWindow()
    try {
      updateWidgetStatus(win, 'transcribing')

      const wavBuffer = await getAudioBuffer()

      const selectedModel = options.getSelectdModel()
      if (!selectedModel) {
        throw new Error('Error while loading current model.')
      }

      const { whisper, llama } = options.getServices()

      // Step 1: Create recording entry as soon as we have the audio
      let prompt = ''
      let shortcutVersionId: string | undefined
      const row = await shortcutsRepo.findById(shortcutId)
      if (row) {
        prompt = row.prompt ?? ''
        shortcutVersionId = row.versionId
      }

      const recordingIdPromise = createRecording({
        wavBuffer,
        selectedModel,
        shortcutVersionId: shortcutVersionId ?? '',
      })

      // Step 2: Transcribe and update
      const rawText = await whisper.request(wavBuffer)
      const text = cleanText(rawText)
      const recordingId = await recordingIdPromise
      if (text) {
        await updateTranscription(recordingId, text)
      }

      // Step 3: Enhance and update
      let enhanced = ''
      if (prompt && text) {
        updateWidgetStatus(win, 'enhancing')
        enhanced = await llama.request(text, prompt)
        if (enhanced) {
          await updateEnhancedText(recordingId, enhanced, 'llama')
        }
      }

      updateWidgetStatus(win, 'finished')
      closeWidgetWithDelay(win, 1250)
      return enhanced || text
    } catch (err) {
      updateWidgetStatus(win, 'error')
      // Wait a bit so the user can see the error status if we want, or just hide
      closeWidgetWithDelay(win, 2000)
      throw err
    }
  })
}

const closeWidgetWithDelay = (win: BrowserWindow | undefined, delay: number) => {
  setTimeout(() => {
    widgetWindowWillHide(win)
  }, delay - 50)
  setTimeout(() => {
    win?.hide()
  }, delay)
}
