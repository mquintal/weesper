import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { recordingsRepo } from '@electron/database'
import type { Model } from '@weesper/ipc'
import { app } from 'electron'

type CreateDeps = {
  repo?: typeof recordingsRepo
  getRecordingsDir?: () => string
}

/**
 * Initializes a recording by saving the audio file to disk and creating a database entry.
 * This is the first step of the recording process.
 */
export async function createRecording(
  {
    wavBuffer,
    selectedModel,
    shortcutVersionId,
  }: {
    wavBuffer: Buffer
    selectedModel: Model
    shortcutVersionId: string
  },
  deps: CreateDeps = {},
) {
  const {
    repo = recordingsRepo,
    getRecordingsDir = () =>
      app.isPackaged
        ? path.join(app.getPath('userData'), 'recordings')
        : path.join(app.getAppPath(), 'resources', 'recordings'),
  } = deps

  const audioId = crypto.randomUUID()
  const recordingsDir = getRecordingsDir()
  await fs.mkdir(recordingsDir, { recursive: true })
  const audioFilePath = path.join(recordingsDir, `${audioId}.wav`)
  await fs.writeFile(audioFilePath, wavBuffer)

  return await repo.create({
    duration: Math.round((wavBuffer.length / 32000) * 1000), // 16kHz 16-bit mono (32000 bytes/sec)
    audioFilePath,
    modelId: selectedModel.id,
    shortcutVersionId,
    transcribedText: null,
    enhancedText: null,
    llmId: null,
  })
}

/**
 * Updates the recording with the transcribed text.
 * This is the second step of the recording process.
 */
export async function updateTranscription(recordingId: string, transcript: string, repo = recordingsRepo) {
  await repo.updateTranscribeText(recordingId, transcript)
}

/**
 * Updates the recording with the enhanced text and the LLM used.
 * This is the final step of the recording process.
 */
export async function updateEnhancedText(
  recordingId: string,
  enhancedText: string,
  llmUsedId: string,
  repo = recordingsRepo,
) {
  await repo.updateEnhancedText(recordingId, enhancedText, llmUsedId)
}
