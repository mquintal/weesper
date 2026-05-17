import type { IpcMain, IpcRenderer } from 'electron'
import * as v from 'valibot'

export const LOGGER_TOPICS = {
  LOG: 'logger:log',
} as const

export const LogLevelSchema = v.union([v.literal('info'), v.literal('warn'), v.literal('error'), v.literal('debug')])

export type LogLevel = v.InferOutput<typeof LogLevelSchema>

export const LogMessageSchema = v.object({
  level: LogLevelSchema,
  process: v.union([v.literal('widget'), v.literal('renderer')]),
  message: v.string(),
  context: v.optional(v.record(v.string(), v.union([v.string(), v.number(), v.boolean(), v.null()]))),
})

export type LogMessage = v.InferOutput<typeof LogMessageSchema>

export const registerLoggerHandler = (ipc: IpcMain, handler: (log: LogMessage) => void) => {
  ipc.on(LOGGER_TOPICS.LOG, (_, log: unknown) => {
    const validated = v.safeParse(LogMessageSchema, log)
    if (validated.success) {
      handler(validated.output)
    }
  })
}

export const sendLog = (ipc: IpcRenderer, log: LogMessage) => {
  ipc.send(LOGGER_TOPICS.LOG, log)
}
