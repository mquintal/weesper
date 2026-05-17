import type { Database as SqliteDatabase } from 'better-sqlite3'
import { Kysely, SqliteDialect } from 'kysely'
import { migrations } from './migrations'
import { RecordingsRepository } from './repositories/recordings'
import { ShortcutsRepository } from './repositories/shortcuts'
import type { Database as DBSchema } from './schema'

export function initDatabase(sqlite: SqliteDatabase) {
  // Initialize schema
  migrations.forEach((migration) => {
    sqlite.exec(migration.up)
  })

  const db = new Kysely<DBSchema>({
    dialect: new SqliteDialect({
      database: sqlite,
    }),
  })

  return {
    db,
    shortcutsRepo: new ShortcutsRepository(db),
    recordingsRepo: new RecordingsRepository(db),
  }
}
