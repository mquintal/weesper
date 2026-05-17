import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Mock Electron IPC so components don't crash
if (typeof window !== 'undefined') {
  const listeners: Record<string, ((event: any, ...args: any[]) => void)[]> = {}

  const ipcMock = {
    on: (channel: string, handler: (event: any, ...args: any[]) => void) => {
      if (!listeners[channel]) listeners[channel] = []
      listeners[channel].push(handler)
    },
    off: (channel: string, handler: (event: any, ...args: any[]) => void) => {
      if (!listeners[channel]) return
      listeners[channel] = listeners[channel].filter((h) => h !== handler)
    },
    invoke: async (_channel: string, ..._args: any[]) => ({ status: 'success', data: {} }),
    send: (channel: string, ...args: any[]) => {
      // Internal method to trigger listeners from stories
      if (listeners[channel]) {
        listeners[channel].forEach((handler) => {
          handler({}, ...args)
        })
      }
    },
    removeAllListeners: (channel: string) => {
      delete listeners[channel]
    },
  }

  ;(window as any).electron = {
    ipcRenderer: ipcMock,
  }
  ;(window as any).ipcRenderer = ipcMock
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const preview: Preview = {
  decorators: [
    (Story) => React.createElement(QueryClientProvider, { client: queryClient }, React.createElement(Story)),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
