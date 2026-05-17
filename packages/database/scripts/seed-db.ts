import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { migrations } from '../src/migrations'

const dbPath = path.join(__dirname, '../dev.db')

if (fs.existsSync(dbPath)) {
  fs.rmSync(dbPath)
}

console.log('🚀 Seeding dev.db using system sqlite3...')

// Combine all migrations into one SQL string
const fullSql = migrations
  .sort((a, b) => a.version - b.version)
  .map((m) => `-- Version ${m.version}\n${m.up}`)
  .join('\n\n')

// Use the system sqlite3 CLI to create the DB and apply the SQL
try {
  execSync(`sqlite3 ${dbPath}`, {
    input: fullSql,
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  console.log('✅ dev.db created at', dbPath)
} catch (error) {
  console.error('❌ Failed to seed database using sqlite3 CLI:', error)
  process.exit(1)
}
