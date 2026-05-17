import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { vi } from 'vitest'

const tmpDir = path.join(os.tmpdir(), `open-bisbis-tests-${Math.random().toString(36).slice(2)}`)
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true })
}

vi.mock('electron', () => ({
  app: {
    getAppPath: vi.fn().mockReturnValue(tmpDir),
    getPath: vi.fn().mockImplementation((name) => path.join(tmpDir, name)),
    isPackaged: false,
  },
  systemPreferences: {
    getMediaAccessStatus: vi.fn(),
    askForMediaAccess: vi.fn(),
    isTrustedAccessibilityClient: vi.fn(),
  },
  globalShortcut: {
    register: vi.fn(),
    unregister: vi.fn(),
    unregisterAll: vi.fn(),
    isRegistered: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  BrowserWindow: vi.fn(),
}))
