import { type ShortcutMode, sendToggleRecording } from '@weesper/ipc'
import { type BrowserWindow, globalShortcut } from 'electron'
import type { GlobalHookService } from '../../utils/global-hook'

const registeredShortcuts = new Map<string, string>()

export const registerShortcutHandler = (
  id: string,
  shortcut: string,
  getWindow: () => BrowserWindow | undefined | null,
  mode: ShortcutMode = 'toggle',
  hookService?: GlobalHookService,
) => {
  if (mode === 'hold' && hookService) {
    // Unregister from globalShortcut first (in case switching from toggle)
    const oldShortcut = registeredShortcuts.get(id)
    if (oldShortcut) {
      globalShortcut.unregister(oldShortcut)
      registeredShortcuts.delete(id)
    }

    if (!shortcut) {
      hookService.unregister(id)
      return
    }

    try {
      hookService.register(id, shortcut)
    } catch (error) {
      console.error(`Failed to register hold shortcut "${id}" (${shortcut}):`, error)
    }
    return
  }

  const oldShortcut = registeredShortcuts.get(id)
  if (oldShortcut) {
    globalShortcut.unregister(oldShortcut)
  }

  // Unregister from hook service (in case switching from hold)
  if (hookService) {
    hookService.unregister(id)
  }

  if (!shortcut) {
    registeredShortcuts.delete(id)
    return
  }

  try {
    globalShortcut.register(shortcut, () => {
      sendToggleRecording(getWindow(), id)
    })
    registeredShortcuts.set(id, shortcut)
    console.log(`Registered global shortcut "${id}": ${shortcut}`)
  } catch (error) {
    console.error(`Failed to register shortcut "${id}" (${shortcut}):`, error)
  }
}

export const unregisterAllShortcuts = () => {
  globalShortcut.unregisterAll()
  registeredShortcuts.clear()
}
