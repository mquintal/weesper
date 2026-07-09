import { PassThrough, Transform } from 'node:stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@weesper/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

import { logger } from '@weesper/logger'
import { createAudioSource } from './source'

const noop = () => {}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createAudioSource', () => {
  it('calls onStart with a PassThrough on the first chunk', () => {
    const onStart = vi.fn((s: PassThrough) => s)
    const source = createAudioSource({ onStart, onEnd: noop, onError: noop })

    source.write(new Uint8Array([1, 2, 3]).buffer)

    expect(onStart).toHaveBeenCalledOnce()
    expect(onStart.mock.calls[0][0]).toBeInstanceOf(PassThrough)

    source.write(null)
  })

  it('does not call onStart again for subsequent chunks in the same session', () => {
    const onStart = vi.fn((s: PassThrough) => s)
    const source = createAudioSource({ onStart, onEnd: noop, onError: noop })

    source.write(new Uint8Array([1]).buffer)
    source.write(new Uint8Array([2]).buffer)
    source.write(new Uint8Array([3]).buffer)

    expect(onStart).toHaveBeenCalledOnce()

    source.write(null)
  })

  it('writes chunk bytes onto the stream', async () => {
    let collecting!: Promise<Buffer>
    const source = createAudioSource({
      onStart: (s) => {
        collecting = new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = []
          s.on('data', (chunk: Buffer) => chunks.push(chunk))
          s.on('end', () => resolve(Buffer.concat(chunks)))
          s.on('error', reject)
        })
        return s
      },
      onEnd: noop,
      onError: noop,
    })

    const payload = new Uint8Array([10, 20, 30, 40]).buffer
    source.write(payload)
    source.write(null)

    const result = await collecting
    expect(result).toEqual(Buffer.from(payload))
  })

  it('null ends the stream gracefully (emits finish)', async () => {
    let capturedStream!: PassThrough
    const source = createAudioSource({
      onStart: (s) => {
        capturedStream = s
        return s
      },
      onEnd: noop,
      onError: noop,
    })

    source.write(new Uint8Array([1]).buffer)

    const finished = new Promise<void>((resolve) => capturedStream.once('finish', resolve))
    source.write(null)

    await expect(finished).resolves.toBeUndefined()
  })

  it('null with no active stream logs a warning and does not throw', () => {
    const source = createAudioSource({
      onStart: vi.fn() as unknown as (s: PassThrough) => PassThrough,
      onEnd: noop,
      onError: noop,
    })

    expect(() => source.write(null)).not.toThrow()
    expect(logger.warn).toHaveBeenCalledOnce()
    expect(logger.warn).toHaveBeenCalledWith('AudioSource: null received but no active stream — ignoring')
  })

  it('starts a fresh session after null closes the previous one', async () => {
    const results: Promise<Buffer>[] = []
    const source = createAudioSource({
      onStart: (s) => {
        results.push(
          new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = []
            s.on('data', (chunk: Buffer) => chunks.push(chunk))
            s.on('end', () => resolve(Buffer.concat(chunks)))
            s.on('error', reject)
          }),
        )
        return s
      },
      onEnd: noop,
      onError: noop,
    })

    // Session 1
    source.write(new Uint8Array([1, 2]).buffer)
    source.write(null)

    // Session 2
    source.write(new Uint8Array([3, 4]).buffer)
    source.write(null)

    expect(results).toHaveLength(2)
    await expect(results[0]).resolves.toEqual(Buffer.from([1, 2]))
    await expect(results[1]).resolves.toEqual(Buffer.from([3, 4]))
  })

  describe('onEnd', () => {
    it('calls onEnd with concatenated buffer on normal completion', async () => {
      const onEnd = vi.fn()
      const source = createAudioSource({
        onStart: (s) => s,
        onEnd,
        onError: noop,
      })

      source.write(new Uint8Array([1, 2, 3]).buffer)
      source.write(new Uint8Array([4, 5]).buffer)
      source.write(null)

      await vi.waitFor(() => {
        expect(onEnd).toHaveBeenCalledWith(Buffer.from([1, 2, 3, 4, 5]))
      })
    })

    it('does not call onEnd when no chunks were written (null immediately)', async () => {
      const onEnd = vi.fn()
      const source = createAudioSource({
        onStart: (s) => s,
        onEnd,
        onError: noop,
      })

      source.write(null)

      await new Promise(setImmediate)
      expect(onEnd).not.toHaveBeenCalled()
    })

    it('calls onEnd for each session independently', async () => {
      const ends: Buffer[] = []
      const source = createAudioSource({
        onStart: (s) => s,
        onEnd: (buf) => ends.push(buf),
        onError: noop,
      })

      source.write(new Uint8Array([1]).buffer)
      source.write(null)

      source.write(new Uint8Array([2, 3]).buffer)
      source.write(null)

      await vi.waitFor(() => {
        expect(ends).toHaveLength(2)
      })
      expect(ends[0]).toEqual(Buffer.from([1]))
      expect(ends[1]).toEqual(Buffer.from([2, 3]))
    })
  })

  describe('onError', () => {
    it('calls onError when downstream stream errors', async () => {
      const onError = vi.fn()
      const source = createAudioSource({
        onStart: (stream) => {
          const erroring = new Transform({
            transform(_chunk, _encoding, callback) {
              callback(new Error('pipe error'))
            },
          })
          stream.pipe(erroring)
          return erroring
        },
        onEnd: noop,
        onError,
      })

      source.write(new Uint8Array([1]).buffer)
      source.write(null)

      await vi.waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'pipe error' }))
      })
    })

    it('does not call onError on normal completion', async () => {
      const onError = vi.fn()
      const source = createAudioSource({
        onStart: (s) => s,
        onEnd: noop,
        onError,
      })

      source.write(new Uint8Array([1, 2]).buffer)
      source.write(null)

      await new Promise(setImmediate)
      expect(onError).not.toHaveBeenCalled()
    })
  })
})
