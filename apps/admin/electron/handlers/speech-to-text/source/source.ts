import type Stream from 'node:stream'
import { PassThrough, Writable } from 'node:stream'
import { logger } from '@weesper/logger'

export type AudioSourceOptions = {
  /**
   * Called with the fresh PassThrough stream at the start of each recording session
   * (i.e. when the first chunk arrives). Use this to pipe the stream downstream.
   */
  onStart: (stream: PassThrough) => Stream
  onEnd: (buffer: Buffer<ArrayBuffer>) => void
  onError: (error: Error) => void
}

export type AudioSource = {
  /**
   * Push an audio chunk onto the active stream.
   * - First call of a session: lazily creates a fresh PassThrough, fires `onStart`, then writes.
   * - Pass `null` to signal end-of-session: ends the current stream gracefully.
   * - Chunks arriving with no active session (after null, before any data): logged and dropped.
   */
  write: (chunk: ArrayBuffer | null) => void
}

export function createAudioSource(options: AudioSourceOptions): AudioSource {
  let current: PassThrough | null = null

  return {
    write(chunk: ArrayBuffer | null) {
      // End-of-session signal
      if (chunk === null) {
        if (!current) {
          logger.warn('AudioSource: null received but no active stream — ignoring')
          return
        }
        current.end()
        current = null
        return
      }

      // Lazy-create stream on first chunk of a new session
      if (!current) {
        current = new PassThrough()
        const piped = options.onStart(current)
        const accumulator = createAccumulator(options.onEnd, options.onError)
        piped.pipe(accumulator)
        piped.on('error', (err) => accumulator.destroy(err))
      }

      current.write(Buffer.from(chunk))
    },
  }
}

const createAccumulator = (
  onFinishCallback: (wavBuffer: Buffer<ArrayBuffer>) => void,
  onErrorCallback: (error: Error) => void,
) => {
  const buffers: Buffer[] = []
  const accumulator = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      buffers.push(chunk)
      callback()
    },
  })

  accumulator.on('finish', () => {
    const wavBuffer = Buffer.concat(buffers)
    onFinishCallback(wavBuffer)
  })

  accumulator.on('error', (error) => {
    onErrorCallback(error)
  })
  return accumulator
}
