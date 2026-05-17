import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['electron/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@electron': path.resolve(import.meta.dirname, './electron'),
    },
  },
})
