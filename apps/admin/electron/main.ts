import * as Sentry from '@sentry/electron/main'
import { app } from 'electron'
import { getRecentLogs } from './logger-setup'

app.setName('Weesper')

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  enabled: app.isPackaged,
  debug: false,
  tracesSampleRate: 0,
  beforeSend(event) {
    // Add recent logs to extra context for errors and fatals
    if (event.level === 'error' || event.level === 'fatal') {
      event.extra = {
        ...event.extra,
        recent_logs: getRecentLogs(),
      }
    }
    return event
  },
})
import('./init')
