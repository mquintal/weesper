import { init } from '@sentry/electron/renderer'
import * as SentryReact from '@sentry/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { logger, setLogger } from '@weesper/logger'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ErrorFallback, ToastProvider } from '@/components'
import './index.css'
import { App } from './App'

if (window.electron?.logger) {
  setLogger(window.electron.logger)
}

init(
  {
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enabled: import.meta.env.PROD,
  },
  (options) => {
    SentryReact.init({
      ...options,
      tracesSampleRate: 1.0,
      integrations: [SentryReact.browserTracingIntegration()],
      beforeSend(event, hint) {
        if (event.level === 'error' || event.level === 'fatal') {
          const error = hint?.originalException
          const message = (error instanceof Error ? error.message : event.message) || 'Unhandled error'

          logger?.error(`[Renderer Unhandled] ${message}`, {
            stack: error instanceof Error ? error.stack : undefined,
            skipSentry: true,
            sentry_event_id: event.event_id,
          })
        }
        return event
      },
    })
  },
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const Main = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <SentryReact.ErrorBoundary fallback={<ErrorFallback />}>
            <App />
          </SentryReact.ErrorBoundary>
        </QueryClientProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}

const root = document.getElementById('root')

if (root) {
  ReactDOM.createRoot(root).render(<Main />)
} else {
  console.error('No root element found.')
}
