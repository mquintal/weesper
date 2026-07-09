import { shortcutsRepo } from '@electron/database'
import type { Model } from '@weesper/ipc'
import { registerRecordingChunk, registerStartRecording, updateWidgetStatus, widgetWindowWillHide } from '@weesper/ipc'
import { logger } from '@weesper/logger'
import type { BrowserWindow, IpcMain } from 'electron'
import { cleanText } from './clean-text'
import { pasteHandler } from './pasteHandler'
import { createRecording, updateEnhancedText, updateTranscription } from './recordings'
import { createAudioSource } from './source'
import { createWavConverter } from './wav-converter'

type Options = {
  getWidgetWindow: () => BrowserWindow | undefined
  getSelectedModel: () => Model | undefined
  getServices: () => {
    llama: { request: (text: string, prompt: string) => Promise<string> }
    whisper: { request: (wav: Buffer) => Promise<string> }
  }
}

export const handler = (ipcMain: IpcMain, options: Options) => {
  let isProcessing = false
  let currentShortcutId: string | undefined

  const source = createAudioSource({
    onStart: (stream) => {
      const wavConverterStream = createWavConverter()
      return stream.pipe(wavConverterStream)
    },
    onEnd: async (wavBuffer) => {
      const win = options.getWidgetWindow()
      if (wavBuffer.length === 0) {
        updateWidgetStatus(win, 'finished')
        closeWidgetWithDelay(win, 1000)
        isProcessing = false
        return
      }

      const selectedModel = options.getSelectedModel()
      if (!selectedModel) {
        logger.error('Error while loading current model.')
        updateWidgetStatus(win, 'error')
        closeWidgetWithDelay(win, 2000)
        isProcessing = false
        return
      }

      let prompt = ''
      let shortcutVersionId = ''
      if (currentShortcutId) {
        const row = await shortcutsRepo.findById(currentShortcutId)
        if (row) {
          prompt = row.prompt ?? ''
          shortcutVersionId = row.versionId
        }
      }

      try {
        const recordingId = await createRecording({
          wavBuffer,
          selectedModel,
          shortcutVersionId,
        })

        updateWidgetStatus(win, 'transcribing')
        const rawText = await options.getServices().whisper.request(wavBuffer)
        const text = cleanText(rawText)

        if (text) {
          await updateTranscription(recordingId, text)
        }

        let enhanced = ''
        if (prompt && text) {
          updateWidgetStatus(win, 'enhancing')
          enhanced = await options.getServices().llama.request(text, prompt)
          if (enhanced) {
            await updateEnhancedText(recordingId, enhanced, 'llama')
          }
        }

        const finalText = enhanced || text
        if (finalText) {
          await pasteHandler(finalText)
        }

        updateWidgetStatus(win, 'finished')
        closeWidgetWithDelay(win, 1250)
      } catch (err) {
        logger.error('Error in onEnd pipeline', { error: String(err) })
        updateWidgetStatus(win, 'error')
        closeWidgetWithDelay(win, 2000)
      } finally {
        isProcessing = false
      }
    },
    onError: (e) => {
      logger.error('AudioSource error', { error: String(e) })
      const win = options.getWidgetWindow()
      updateWidgetStatus(win, 'error')
      closeWidgetWithDelay(win, 2000)
      isProcessing = false
    },
  })

  registerStartRecording(ipcMain, async (shortcutId) => {
    if (isProcessing) return false
    isProcessing = true
    currentShortcutId = shortcutId

    const win = options.getWidgetWindow()
    win?.showInactive()
    updateWidgetStatus(win, 'recording')
    return true
  })

  registerRecordingChunk(ipcMain, (chunk: ArrayBuffer | null) => {
    source.write(chunk)
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
