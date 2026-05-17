import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import path from 'node:path'
import { logger } from '@open-bisbis/logger'
import { RESOURCES_PATH } from '../../config'

export const processAudio = () => {
  let ffmpegProcess: ChildProcessWithoutNullStreams | null = null
  let ffmpegOutput: Buffer[] = []
  let ffmpegStderr: string = ''
  let ffmpegExitCode: number | null = null
  let ffmpegError: string = ''
  const ffmpegPath = path.join(RESOURCES_PATH, 'ffmpeg/ffmpeg')

  const reset = () => {
    ffmpegOutput = []
    ffmpegStderr = ''
    ffmpegExitCode = null
    ffmpegError = ''
  }

  const runFfmpeg = () => {
    // -f matroska: WebM/Opus is a subset of Matroska
    // -i pipe:0: Read from stdin
    // -f wav: Output as WAV
    // pipe:1: Write to stdout
    const process = spawn(ffmpegPath, [
      '-f',
      'matroska',
      '-i',
      'pipe:0',
      '-f',
      'wav',
      '-ar',
      '16000',
      '-ac',
      '1',
      'pipe:1',
    ])

    process?.stdout.on('data', (chunk: Buffer) => {
      ffmpegOutput.push(chunk)
    })

    process?.stderr.on('data', (chunk: Buffer) => {
      // Draining stderr is critical to prevent FFmpeg from hanging when its buffer is full
      ffmpegStderr += chunk.toString()
      if (ffmpegStderr.length > 2000) {
        ffmpegStderr = ffmpegStderr.slice(-2000)
      }

      logger.debug('FFmpeg stderr', { chunk: chunk.toString() })
    })

    process?.on('error', (err) => {
      ffmpegError = err.message
      logger.error('FFmpeg error', { err: err.message })
    })

    process?.on('exit', (code) => {
      ffmpegExitCode = code
      logger.info('FFmpeg exit', { code })
    })
    return process
  }

  return {
    get error() {
      return ffmpegStderr || ffmpegError
    },
    get errorCode() {
      return ffmpegExitCode
    },
    start: () => {
      logger.debug('FFmpeg starting')
      if (ffmpegProcess) {
        ffmpegProcess.stdin.end()
        ffmpegProcess.kill()
        ffmpegProcess = null
        logger.debug('FFmpeg starting...killed existing')
      }
      reset()
      ffmpegProcess = runFfmpeg()
      logger.debug('FFmpeg started')
    },
    writeChunk: (chunk: ArrayBuffer) => {
      if (ffmpegProcess?.stdin.writable) {
        ffmpegProcess.stdin.write(Buffer.from(chunk))
      }
    },
    getAudioBuffer: async () => {
      if (!ffmpegProcess) return Buffer.alloc(0)

      ffmpegProcess.stdin.end()

      await new Promise((resolve) => {
        ffmpegProcess?.on('exit', resolve)
        // Safety timeout in case ffmpeg hangs, though stdin.end() should prevent it
        setTimeout(resolve, 2000)
      })

      const wavBuffer = Buffer.concat(ffmpegOutput)
      ffmpegProcess = null
      ffmpegOutput = []

      return wavBuffer
    },
  }
}
