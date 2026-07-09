import fs from 'node:fs'
import path from 'node:path'
import { getSelectedModel } from '@weesper/config'
import { logger } from '@weesper/logger'
import * as v from 'valibot'
import { models, RESOURCES_PATH, VAD_MODEL_PATH } from '../config'
import { getOptimalThreadCount } from '../utils/cpu'
import { createManagedService } from './server'

const WHISPER_SERVER_PORT = Number(process.env.WHISPER_SERVER_PORT || 8760)
const whisperServerPath = path.join(RESOURCES_PATH, 'whisper.cpp/whisper-server')

const service = createManagedService<Buffer, string>({
  name: 'whisper',
  executable: whisperServerPath,
  port: WHISPER_SERVER_PORT,
  healthCheckTimeout: 15000,
  resolveModel: () => {
    const selectedModelId = getSelectedModel()?.id
    const model = models.find((m) => m.id === selectedModelId)
    if (model && fs.existsSync(model.path)) {
      const args: string[] = [
        '-m',
        model.path,
        '-t',
        String(getOptimalThreadCount()),
        '--port',
        String(WHISPER_SERVER_PORT),
        '--host',
        '127.0.0.1',
      ]

      if (fs.existsSync(VAD_MODEL_PATH)) {
        args.push('--vad', '--vad-model', VAD_MODEL_PATH)
      } else {
        logger.warn('VAD model not found, running without VAD', { path: VAD_MODEL_PATH })
      }

      return {
        path: model.path,
        args,
      }
    }
    return null
  },
  execute: async (port, wav) => {
    const formData = new FormData()
    logger.info('Starting transcription')
    console.time('transcribe')
    // @ts-expect-error - native Blob accepts Buffer in node
    formData.append('file', new Blob([wav]), 'audio.wav')
    formData.append('language', getSelectedModel()?.language ?? 'en')
    formData.append('response_format', 'json')

    const response = await fetch(`http://127.0.0.1:${port}/inference`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Whisper server failed: ${response.statusText} - ${text}`)
    }

    const data = await response.json()
    const validData = v.safeParse(SchemaResponse, data)
    if (!validData.success) {
      throw new Error('Failed to parse transcription result: unexpected schema')
    }
    console.timeEnd('transcribe')
    return validData.output.text
  },
})

export const init = service.init
export const stop = service.stop
export const request = service.request

const SchemaResponse = v.object({
  text: v.string(),
})
