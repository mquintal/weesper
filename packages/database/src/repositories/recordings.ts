import crypto from 'node:crypto'
import type { Kysely } from 'kysely'
import type { Database, NewRecording } from '../schema'

export class RecordingsRepository {
  constructor(private db: Kysely<Database>) {}

  async list() {
    return await this.db.selectFrom('recordings').selectAll().orderBy('createdAt desc').execute()
  }

  async findById(id: string) {
    return await this.db.selectFrom('recordings').selectAll().where('id', '=', id).executeTakeFirst()
  }

  async create(recording: Omit<NewRecording, 'createdAt' | 'updatedAt' | 'id'>) {
    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    await this.db
      .insertInto('recordings')
      .values({ ...recording, id, createdAt: now, updatedAt: now })
      .execute()

    return id
  }

  async updateTranscribeText(id: string, text: string) {
    const now = new Date().toISOString()
    return await this.db
      .updateTable('recordings')
      .set({ transcribedText: text, updatedAt: now })
      .where('id', '=', id)
      .execute()
  }

  async updateEnhancedText(id: string, text: string, llmUsedId: string) {
    const now = new Date().toISOString()
    return await this.db
      .updateTable('recordings')
      .set({ enhancedText: text, llmId: llmUsedId, updatedAt: now })
      .where('id', '=', id)
      .execute()
  }

  async delete(id: string) {
    return await this.db.deleteFrom('recordings').where('id', '=', id).execute()
  }
}
