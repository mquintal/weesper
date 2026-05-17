import type { Kysely } from 'kysely'
import type { Database, NewShortcut, NewShortcutVersion } from '../schema'

export class ShortcutsRepository {
  constructor(private db: Kysely<Database>) {}

  async list() {
    return await this.db
      .selectFrom('shortcuts')
      .innerJoin('shortcut_versions', (join) =>
        join
          .onRef('shortcuts.id', '=', 'shortcut_versions.shortcutId')
          .onRef('shortcuts.currentVersion', '=', 'shortcut_versions.version'),
      )
      .select([
        'shortcuts.id',
        'shortcut_versions.name',
        'shortcut_versions.shortcut',
        'shortcut_versions.prompt',
        'shortcuts.status',
        'shortcuts.createdAt',
        'shortcuts.updatedAt',
        'shortcut_versions.version',
        'shortcut_versions.shortcutId',
      ])
      .where('shortcuts.status', '!=', 'deleted')
      .execute()
  }

  async findById(id: string) {
    return await this.db
      .selectFrom('shortcuts')
      .innerJoin('shortcut_versions', (join) =>
        join
          .onRef('shortcuts.id', '=', 'shortcut_versions.shortcutId')
          .onRef('shortcuts.currentVersion', '=', 'shortcut_versions.version'),
      )
      .select([
        'shortcuts.id',
        'shortcut_versions.id as versionId',
        'shortcut_versions.name',
        'shortcut_versions.shortcut',
        'shortcut_versions.prompt',
        'shortcuts.status',
        'shortcuts.currentVersion',
        'shortcuts.createdAt',
        'shortcuts.updatedAt',
        'shortcut_versions.version',
        'shortcut_versions.shortcutId',
      ])
      .where('shortcuts.id', '=', id)
      .executeTakeFirst()
  }

  async create(shortcut: NewShortcut, version: NewShortcutVersion) {
    return await this.db.transaction().execute(async (trx) => {
      await trx.insertInto('shortcuts').values(shortcut).execute()
      await trx.insertInto('shortcut_versions').values(version).execute()
    })
  }

  async update(id: string, currentVersion: number, version: NewShortcutVersion) {
    return await this.db.transaction().execute(async (trx) => {
      await trx
        .updateTable('shortcuts')
        .set({ currentVersion, updatedAt: new Date().toISOString() })
        .where('id', '=', id)
        .execute()
      await trx.insertInto('shortcut_versions').values(version).execute()
    })
  }

  async softDelete(id: string) {
    return await this.db
      .updateTable('shortcuts')
      .set({ status: 'deleted', updatedAt: new Date().toISOString() })
      .where('id', '=', id)
      .execute()
  }
}
