import * as Sentry from '@sentry/electron/main'
import { registerLoggerHandler } from '@weesper/ipc'
import type { LogContext } from '@weesper/logger'
import { setLogger } from '@weesper/logger'
import { ipcMain } from 'electron'
import type { LogMessage } from 'electron-log'
import log from 'electron-log/main'

// Configure electron-log
// It automatically saves logs to the user data directory:
// macOS: ~/Library/Logs/Weesper/main.log
log.transports.file.level = 'info'
log.transports.file.maxSize = 5 * 1024 * 1024 // 5MB

const mapLogMessageToFinalMessage = (message: LogMessage) => {
  const { date, level, data } = message
  const [msg, context] = data
  const { process, ...rest } = context || {}

  return {
    timestamp: date.toISOString(),
    level: level,
    process: process || 'unknown',
    message: msg,
    context: rest,
  }
}

// Each line in the file will be a JSON object
log.transports.file.format = ({ message }) => {
  return [JSON.stringify(mapLogMessageToFinalMessage(message))]
}

// Keep console logs readable for development
log.transports.console.format = '[{process}] [{level}] {text}'

// Ring buffer for Sentry context
const RING_BUFFER_SIZE = 200
const ringBuffer: string[] = []

const addToRingBuffer = (message: LogMessage) => {
  const entry = JSON.stringify(mapLogMessageToFinalMessage(message))

  ringBuffer.push(entry)
  if (ringBuffer.length > RING_BUFFER_SIZE) {
    ringBuffer.shift()
  }
}

// Hook into electron-log to fill the ring buffer and inject variables
// This will capture everything sent via log.info, log.error, etc.
log.hooks.push((message, transport) => {
  const context = message.data[1]
  const processName = context?.process || 'main'

  // Only add to ring buffer once
  if (transport === log.transports.file) {
    addToRingBuffer(message)
  }

  // @ts-expect-error Inject variables for format placeholders
  message.variables = {
    ...message.variables,
    process: String(processName),
  }

  return message
})

// Initialize the abstract logger for the main process
const abstractLogger = {
  info: (msg: string, context?: LogContext) => {
    log.info(msg, context)
  },
  warn: (msg: string, context?: LogContext) => log.warn(msg, context),
  error: (msg: string, context?: LogContext & { skipSentry?: boolean }) => {
    log.error(msg, context)

    if (context?.skipSentry) {
      return
    }

    const processName = context?.process || 'unknown'
    Sentry.captureMessage(msg, {
      level: 'error',
      tags: { process: processName },
      extra: { context },
    })
  },
  debug: (msg: string, ...args: any[]) => log.debug(msg, ...args),
}

// Set the main logger
setLogger(abstractLogger)

// Register IPC handler for renderer logs
registerLoggerHandler(ipcMain, (msg) => {
  const { level, message, process, context } = msg

  // Use the abstract logger to ensure Sentry reporting is triggered
  const loggerFn = abstractLogger[level] || abstractLogger.info
  loggerFn(message, { ...(context ?? {}), process })
})

export const getRecentLogs = () => ringBuffer.join('\n')
