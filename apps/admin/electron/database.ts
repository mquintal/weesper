import fs from 'node:fs'
import path from 'node:path'
import { initDatabase } from '@weesper/database'
import Database from 'better-sqlite3'
import { getResourcePath } from './config'

const dbPath = getResourcePath('database.sqlite', 'db')
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const sqlite = new Database(dbPath)
export const { shortcutsRepo, recordingsRepo } = initDatabase(sqlite)
