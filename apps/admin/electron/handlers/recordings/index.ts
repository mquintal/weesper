import fs from 'node:fs/promises'
import { recordingsRepo } from '@electron/database'
import {
  type Recording,
  registerDeleteRecording,
  registerGetRecording,
  registerGetRecordingAudio,
  registerListRecordings,
} from '@weesper/ipc'
import type { IpcMain } from 'electron'

type Deps = {
  repo: typeof recordingsRepo
}

export const handler = (ipcMain: IpcMain, deps: Deps = { repo: recordingsRepo }) => {
  const { repo } = deps

  registerListRecordings(ipcMain, async () => {
    const rows = await repo.list()
    return rows as Recording[]
  })

  registerGetRecording(ipcMain, async (id) => {
    const row = await repo.findById(id)
    return row as Recording | undefined
  })

  registerGetRecordingAudio(ipcMain, async (id) => {
    const row = await repo.findById(id)
    if (!row?.audioFilePath) return null
    try {
      const buffer = await fs.readFile(row.audioFilePath)
      return new Uint8Array(buffer)
    } catch (err) {
      console.error('Failed to read audio file:', err)
      return null
    }
  })

  registerDeleteRecording(ipcMain, async (id) => {
    try {
      const recording = await repo.findById(id)

      if (recording?.audioFilePath) {
        try {
          await fs.unlink(recording.audioFilePath)
        } catch (err) {
          console.error(`Failed to delete audio file: ${recording.audioFilePath}`, err)
          // Continue to delete from DB even if file doesn't exist
        }
      }

      await repo.delete(id)
      return true
    } catch (e) {
      console.error('Failed to delete recording:', e)
      return false
    }
  })
}
