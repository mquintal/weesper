import crypto from 'node:crypto'
import { shortcutsRepo } from '@electron/database'
import { getShortcutMode, setShortcutMode } from '@weesper/config'
import {
  registerCreateShortcut,
  registerDeleteShortcut,
  registerGetDefaultShortcut,
  registerGetShortcutMode,
  registerListShortcuts,
  registerSetDefaultShortcut,
  registerSetShortcutMode,
  registerUpdateShortcut,
  type ShortcutMode,
} from '@weesper/ipc'
import { logger } from '@weesper/logger'
import { type BrowserWindow, globalShortcut, type IpcMain } from 'electron'
import type { GlobalHookService } from '../../utils/global-hook'
import { toElectronShortcut, toUIShortcut } from './mapping'
import { registerShortcutHandler, unregisterAllShortcuts } from './registerShortcutHandler'

type Options = {
  getWindow: () => BrowserWindow | undefined | null
  hookService: GlobalHookService
  repo?: typeof shortcutsRepo
}

const reRegisterAllShortcuts = async (
  repo: typeof shortcutsRepo,
  mode: ShortcutMode,
  hookService: GlobalHookService,
  getWindow: () => BrowserWindow | undefined | null,
) => {
  const activeShortcuts = await repo.list()
  activeShortcuts.forEach((row) => {
    registerShortcutHandler(row.id, row.shortcut, getWindow, mode, hookService)
  })
}

export const handler = (ipcMain: IpcMain, options: Options) => {
  const { repo = shortcutsRepo, getWindow, hookService } = options

  const buildShortcutVersion = (
    shortcutId: string,
    version: number,
    name: string,
    shortcut: string,
    prompt: string,
  ) => ({
    id: crypto.randomUUID(),
    shortcutId,
    version,
    name,
    shortcut,
    prompt,
  })

  registerGetShortcutMode(ipcMain, () => {
    return getShortcutMode()
  })

  registerSetShortcutMode(ipcMain, async (mode: ShortcutMode) => {
    setShortcutMode(mode)

    // Re-register all shortcuts with the new mode
    globalShortcut.unregisterAll()
    hookService.unregisterAll()

    if (mode === 'hold') {
      hookService.start()
    } else {
      hookService.stop()
    }

    await reRegisterAllShortcuts(repo, mode, hookService, getWindow)

    logger.info(`[Shortcuts Handler] Switched to ${mode} mode and re-registered all shortcuts`)
    return true
  })

  registerGetDefaultShortcut(ipcMain, async () => {
    const data = await repo.findById('default')
    if (!data) return '' // fallback if no default
    return toUIShortcut(data.shortcut)
  })

  registerSetDefaultShortcut(ipcMain, async (uiShortcut: string) => {
    const electronShortcut = toElectronShortcut(uiShortcut)
    const mode = getShortcutMode()

    const existing = await repo.findById('default')
    const newVersion = existing ? existing.currentVersion + 1 : 1

    const versionData = buildShortcutVersion('default', newVersion, 'default', electronShortcut, '')

    if (!existing) {
      await repo.create({ id: 'default', currentVersion: newVersion, status: 'enabled' }, versionData)
    } else {
      await repo.update('default', newVersion, versionData)
    }

    registerShortcutHandler('default', electronShortcut, getWindow, mode, hookService)
    return true
  })

  registerListShortcuts(ipcMain, async () => {
    const rows = await repo.list()
    // Filter out 'default' from custom shortcuts list
    return rows
      .filter((row) => row.id !== 'default')
      .map((row) => ({
        ...row,
        prompt: row.prompt ?? '',
        shortcut: toUIShortcut(row.shortcut),
      }))
  })

  registerCreateShortcut(ipcMain, async (shortcut: { name: string; shortcut: string; prompt: string }) => {
    const electronShortcut = toElectronShortcut(shortcut.shortcut)
    const mode = getShortcutMode()
    const shortcutId = crypto.randomUUID()

    await repo.create(
      { id: shortcutId, currentVersion: 1, status: 'enabled' },
      buildShortcutVersion(shortcutId, 1, shortcut.name, electronShortcut, shortcut.prompt),
    )

    registerShortcutHandler(shortcutId, electronShortcut, getWindow, mode, hookService)
    return true
  })

  registerUpdateShortcut(ipcMain, async (id: string, shortcut: { name: string; shortcut: string; prompt: string }) => {
    const existing = await repo.findById(id)
    if (!existing) return false

    const newVersion = existing.currentVersion + 1
    const electronShortcut = toElectronShortcut(shortcut.shortcut)
    const mode = getShortcutMode()

    await repo.update(
      id,
      newVersion,
      buildShortcutVersion(id, newVersion, shortcut.name, electronShortcut, shortcut.prompt),
    )

    registerShortcutHandler(id, electronShortcut, getWindow, mode, hookService)
    return true
  })

  registerDeleteShortcut(ipcMain, async (id: string) => {
    await repo.softDelete(id)
    const mode = getShortcutMode()

    registerShortcutHandler(id, '', getWindow, mode, hookService)
    return true
  })

  return {
    ensureDefaultShortcut: async () => {
      const existing = await repo.findById('default')
      if (!existing) {
        const electronShortcut = 'CommandOrControl+Alt+R'
        const newVersion = 1
        await repo.create(
          { id: 'default', currentVersion: newVersion, status: 'enabled' },
          buildShortcutVersion('default', newVersion, 'default', electronShortcut, ''),
        )
        console.log('Created default shortcut: CommandOrControl+Alt+R')
      }
    },
    registerShortcut: (id: string, shortcut: string, mode?: ShortcutMode) => {
      registerShortcutHandler(id, shortcut, getWindow, mode ?? getShortcutMode(), hookService)
    },
    unregisterAllShortcuts,
  }
}
