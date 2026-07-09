import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import { Duplex } from 'node:stream'

export class WavConverter extends Duplex {
  private ffmpeg: ChildProcessWithoutNullStreams

  constructor(ffmpegPath: string, args: string[]) {
    super()

    this.ffmpeg = spawn(ffmpegPath, args)

    this.ffmpeg.stdout.on('data', (chunk) => {
      if (!this.push(chunk)) {
        this.ffmpeg.stdout.pause()
      }
    })

    this.ffmpeg.stdout.on('end', () => {
      this.push(null)
    })

    this.on('finish', () => {
      this.ffmpeg.stdin.end()
    })

    this.ffmpeg.stderr.on('data', (chunk) => {
      console.log('FFmpeg STDERR:', chunk.toString())
    })

    this.ffmpeg.on('error', (err) => {
      console.error('FFmpeg ERROR:', err)
    })
  }

  _write(chunk: unknown, _encoding: unknown, cb: () => void) {
    if (this.ffmpeg.stdin.write(chunk)) {
      cb()
    } else {
      this.ffmpeg.stdin.once('drain', cb)
    }
  }

  _read() {
    this.ffmpeg.stdout.resume()
  }

  _final(cb: () => void) {
    this.ffmpeg.stdin.end(cb)
  }
}
