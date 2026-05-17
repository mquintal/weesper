import crypto from 'node:crypto'
import { shortcutsRepo } from '@electron/database'
import {
  registerCreateShortcut,
  registerDeleteShortcut,
  registerGetDefaultShortcut,
  registerListShortcuts,
  registerSetDefaultShortcut,
  registerUpdateShortcut,
} from '@open-bisbis/ipc'
import { type BrowserWindow, globalShortcut as electronGlobalShortcut, type IpcMain } from 'electron'
import { toElectronShortcut, toUIShortcut } from './mapping'
import { registerShortcutHandler } from './registerShortcutHandler'

type Options = {
  getWindow: () => BrowserWindow | undefined | null
  repo?: typeof shortcutsRepo
  globalShortcut?: typeof electronGlobalShortcut
}

export const handler = (ipcMain: IpcMain, options: Options) => {
  const { repo = shortcutsRepo, globalShortcut = electronGlobalShortcut, getWindow } = options

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

  registerGetDefaultShortcut(ipcMain, async () => {
    const data = await repo.findById('default')
    if (!data) return '' // fallback if no default
    return toUIShortcut(data.shortcut)
  })

  registerSetDefaultShortcut(ipcMain, async (uiShortcut: string) => {
    const electronShortcut = toElectronShortcut(uiShortcut)

    const existing = await repo.findById('default')
    const newVersion = existing ? existing.currentVersion + 1 : 1

    const versionData = buildShortcutVersion('default', newVersion, 'default', electronShortcut, '')

    if (!existing) {
      await repo.create({ id: 'default', currentVersion: newVersion, status: 'enabled' }, versionData)
    } else {
      await repo.update('default', newVersion, versionData)
    }

    registerShortcutHandler('default', electronShortcut, getWindow)
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
    const shortcutId = crypto.randomUUID()

    await repo.create(
      { id: shortcutId, currentVersion: 1, status: 'enabled' },
      buildShortcutVersion(shortcutId, 1, shortcut.name, electronShortcut, shortcut.prompt),
    )

    registerShortcutHandler(shortcutId, electronShortcut, getWindow)
    return true
  })

  registerUpdateShortcut(ipcMain, async (id: string, shortcut: { name: string; shortcut: string; prompt: string }) => {
    const existing = await repo.findById(id)
    if (!existing) return false

    const newVersion = existing.currentVersion + 1
    const electronShortcut = toElectronShortcut(shortcut.shortcut)

    await repo.update(
      id,
      newVersion,
      buildShortcutVersion(id, newVersion, shortcut.name, electronShortcut, shortcut.prompt),
    )

    registerShortcutHandler(id, electronShortcut, getWindow)
    return true
  })

  registerDeleteShortcut(ipcMain, async (id: string) => {
    await repo.softDelete(id)

    registerShortcutHandler(id, '', getWindow)
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
    registerShortcut: (id: string, shortcut: string) => {
      registerShortcutHandler(id, shortcut, getWindow)
    },
    unregisterAllShortcuts: () => {
      globalShortcut.unregisterAll()
    },
  }
}
