const MODIFIER_MAP: Record<string, string> = {
  '⌘': 'CommandOrControl',
  '⌥': 'Alt',
  '⌃': 'Control',
  '⇧': 'Shift',
}

const REVERSE_MODIFIER_MAP: Record<string, string> = {
  CommandOrControl: '⌘',
  CmdOrCtrl: '⌘',
  Command: '⌘',
  Cmd: '⌘',
  Control: '⌃',
  Ctrl: '⌃',
  Alt: '⌥',
  Option: '⌥',
  Shift: '⇧',
}

const KEY_MAP: Record<string, string> = {
  '↑': 'Up',
  '↓': 'Down',
  '←': 'Left',
  '→': 'Right',
  ESC: 'Escape',
  SPACE: 'Space',
}

const REVERSE_KEY_MAP: Record<string, string> = {
  Up: '↑',
  Down: '↓',
  Left: '←',
  Right: '→',
  Escape: 'ESC',
  Esc: 'ESC',
  Space: 'SPACE',
}

/**
 * Converts a UI shortcut string (e.g. "⌘ + ⌥ + R") to an Electron accelerator string (e.g. "CommandOrControl+Alt+R")
 */
export const toElectronShortcut = (uiShortcut: string): string => {
  return uiShortcut
    .split(' + ')
    .map((part) => {
      const trimmed = part.trim()
      return MODIFIER_MAP[trimmed] || KEY_MAP[trimmed] || trimmed
    })
    .join('+')
}

/**
 * Converts an Electron accelerator string (e.g. "CommandOrControl+Alt+R") to a UI shortcut string (e.g. "⌘ + ⌥ + R")
 */
export const toUIShortcut = (electronShortcut: string): string => {
  return electronShortcut
    .split('+')
    .map((part) => {
      const trimmed = part.trim()
      // Electron accelerators are case-insensitive, but we store them in a certain way
      // We should check case-insensitively for the reverse map
      const match = Object.keys(REVERSE_MODIFIER_MAP).find((k) => k.toLowerCase() === trimmed.toLowerCase())
      if (match) return REVERSE_MODIFIER_MAP[match]

      const keyMatch = Object.keys(REVERSE_KEY_MAP).find((k) => k.toLowerCase() === trimmed.toLowerCase())
      if (keyMatch) return REVERSE_KEY_MAP[keyMatch]

      return trimmed.toUpperCase()
    })
    .join(' + ')
}
