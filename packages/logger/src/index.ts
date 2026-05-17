export type LogContext = Record<string, string | number | boolean | null | undefined>

export type ILogger = {
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  debug(message: string, context?: LogContext): void
}

let currentLogger: ILogger = {
  info: (msg, context) => console.log(`[INFO] ${msg}`, context),
  warn: (msg, context) => console.warn(`[WARN] ${msg}`, context),
  error: (msg, context) => console.error(`[ERROR] ${msg}`, context),
  debug: (msg, context) => console.debug(`[DEBUG] ${msg}`, context),
}

export const setLogger = (logger: ILogger) => {
  currentLogger = logger
}

export const logger: ILogger = {
  info: (msg, context) => currentLogger.info(msg, context),
  warn: (msg, context) => currentLogger.warn(msg, context),
  error: (msg, context) => currentLogger.error(msg, context),
  debug: (msg, context) => currentLogger.debug(msg, context),
}
