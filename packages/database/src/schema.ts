import type { Insertable, Selectable, Updateable } from 'kysely'
import type { DB, Generated } from './schema.generated'

export type { DB as Database } from './schema.generated'

// Shortcuts
/**
 * The possible values for the `status` column on the `shortcuts` table.
 * SQLite has no native ENUM type, so this is enforced by a CHECK constraint
 * in the migration. kysely-codegen cannot infer this from SQLite metadata,
 * so we narrow the type manually here.
 */
export type ShortcutStatus = 'enabled' | 'disabled' | 'deleted'

type ShortcutsTable = Omit<DB['shortcuts'], 'status'> & {
  status: Generated<ShortcutStatus>
}

export type Shortcut = Selectable<ShortcutsTable>
export type NewShortcut = Insertable<ShortcutsTable>
export type ShortcutUpdate = Updateable<ShortcutsTable>

// Shortcut Versions
export type ShortcutVersion = Selectable<DB['shortcut_versions']>
export type NewShortcutVersion = Insertable<DB['shortcut_versions']>

// Recordings
export type Recording = Selectable<DB['recordings']>
export type NewRecording = Insertable<DB['recordings']>
export type RecordingUpdate = Updateable<DB['recordings']>
