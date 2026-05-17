import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import path from 'node:path'

export enum DownloadState {
  Progress = 'progress',
  Finished = 'finished',
  Error = 'error',
}

export type DownloadPayload =
  | { state: DownloadState.Progress; progress: number; downloadedBytes: number; totalBytes: number }
  | { state: DownloadState.Finished }
  | { state: DownloadState.Error; error: Error }

export type DownloadCallback = (state: DownloadPayload) => void

/**
 * Downloads a model from a URL to a specific file path.
 * Uses only Node.js built-in modules.
 * Handles redirects and provides progress updates via callback.
 *
 * @param url - The URL to download the model from
 * @param destPath - The local file path to save the model to
 * @param callback - Function called with progress, finish, or error state
 * @returns A function to cancel the download
 */
export function downloadResource(url: string, destPath: string, callback: DownloadCallback): () => void {
  // Ensure the directory exists
  const destDir = path.dirname(destPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  const protocol = url.startsWith('https') ? https : http
  let fileStream: fs.WriteStream | null = null
  let isCancelled = false
  let currentCancel: (() => void) | null = null

  const request = protocol.get(url, (response) => {
    // Handle redirects
    if (response.statusCode === 301 || response.statusCode === 302) {
      if (response.headers.location) {
        // Resolve relative URLs if necessary
        const nextUrl = response.headers.location.startsWith('http')
          ? response.headers.location
          : new URL(response.headers.location, url).toString()

        currentCancel = downloadResource(nextUrl, destPath, callback)
        if (isCancelled) currentCancel()
        return
      }
    }

    if (response.statusCode !== 200) {
      callback({
        state: DownloadState.Error,
        error: new Error(`Failed to download resource: ${response.statusCode} ${response.statusMessage}`),
      })
      return
    }

    const totalBytes = parseInt(response.headers['content-length'] || '0', 10)
    let downloadedBytes = 0

    fileStream = fs.createWriteStream(destPath)

    response.on('data', (chunk) => {
      downloadedBytes += chunk.length

      const progress = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 0

      callback({
        state: DownloadState.Progress,
        progress,
        downloadedBytes,
        totalBytes,
      })
    })

    response.on('end', () => {
      if (fileStream) {
        fileStream.on('finish', () => {
          if (!isCancelled) {
            callback({ state: DownloadState.Finished })
          }
        })
      }
    })

    response.pipe(fileStream)

    fileStream.on('error', (err) => {
      if (!isCancelled) {
        callback({ state: DownloadState.Error, error: err })
      }
    })
  })

  request.on('error', (err) => {
    if (!isCancelled) {
      callback({ state: DownloadState.Error, error: err })
    }
  })

  return () => {
    isCancelled = true
    if (currentCancel) {
      currentCancel()
    }
    request.destroy()
    if (fileStream) {
      fileStream.destroy()
    }
  }
}

export const download = (
  url: string,
  destPath: string,
  size: number,
  callback: (state: { state: DownloadState; percentage: number }) => void,
) => {
  callback({ state: DownloadState.Progress, percentage: 0 })
  return downloadResource(url, destPath, (state) => {
    if (state.state === DownloadState.Progress) {
      const progress = Math.round((state.downloadedBytes / size) * 100)
      console.log(`Downloading resource: ${progress}%`)
      callback({ state: DownloadState.Progress, percentage: progress })
    } else if (state.state === DownloadState.Finished) {
      console.log('Resource downloaded successfully')
      callback({ state: DownloadState.Finished, percentage: 100 })
    } else if (state.state === DownloadState.Error) {
      console.error('Failed to download resource:', state.error)
      callback({ state: DownloadState.Error, percentage: 0 })
    }
  })
}
