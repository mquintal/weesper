import { sendToggleRecording } from '@open-bisbis/ipc'
import { type BrowserWindow, globalShortcut } from 'electron'

const registeredShortcuts = new Map<string, string>()

export const registerShortcutHandler = (
  id: string,
  shortcut: string,
  getWindow: () => BrowserWindow | undefined | null,
) => {
  const oldShortcut = registeredShortcuts.get(id)
  if (oldShortcut) {
    globalShortcut.unregister(oldShortcut)
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
