import { logger } from '@weesper/logger'
import type { BrowserWindow } from 'electron'
import { UiohookKey, type UiohookKeyboardEvent, uIOhook } from 'uiohook-napi'

const MODIFIER_NAMES = new Set([
  'CommandOrControl',
  'CmdOrCtrl',
  'Command',
  'Cmd',
  'Super',
  'Control',
  'Ctrl',
  'Alt',
  'Option',
  'Shift',
])

type ShortcutEntry = {
  id: string
  primaryKeycode: number
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  shiftKey: boolean
}

const KEYCODE_MAP: Record<string, number> = {
  A: UiohookKey.A,
  B: UiohookKey.B,
  C: UiohookKey.C,
  D: UiohookKey.D,
  E: UiohookKey.E,
  F: UiohookKey.F,
  G: UiohookKey.G,
  H: UiohookKey.H,
  I: UiohookKey.I,
  J: UiohookKey.J,
  K: UiohookKey.K,
  L: UiohookKey.L,
  M: UiohookKey.M,
  N: UiohookKey.N,
  O: UiohookKey.O,
  P: UiohookKey.P,
  Q: UiohookKey.Q,
  R: UiohookKey.R,
  S: UiohookKey.S,
  T: UiohookKey.T,
  U: UiohookKey.U,
  V: UiohookKey.V,
  W: UiohookKey.W,
  X: UiohookKey.X,
  Y: UiohookKey.Y,
  Z: UiohookKey.Z,
  0: UiohookKey['0'],
  1: UiohookKey['1'],
  2: UiohookKey['2'],
  3: UiohookKey['3'],
  4: UiohookKey['4'],
  5: UiohookKey['5'],
  6: UiohookKey['6'],
  7: UiohookKey['7'],
  8: UiohookKey['8'],
  9: UiohookKey['9'],
  Up: UiohookKey.ArrowUp,
  Down: UiohookKey.ArrowDown,
  Left: UiohookKey.ArrowLeft,
  Right: UiohookKey.ArrowRight,
  Escape: UiohookKey.Escape,
  Space: UiohookKey.Space,
}

const MODIFIER_KEYCODES: Set<number> = new Set([
  UiohookKey.Alt,
  UiohookKey.AltRight,
  UiohookKey.Ctrl,
  UiohookKey.CtrlRight,
  UiohookKey.Meta,
  UiohookKey.MetaRight,
  UiohookKey.Shift,
  UiohookKey.ShiftRight,
])

const parseAccelerator = (accelerator: string): ShortcutEntry => {
  const parts = accelerator.split('+').map((p) => p.trim())

  let altKey = false
  let ctrlKey = false
  let metaKey = false
  let shiftKey = false
  let primaryKeyName = ''

  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower === 'alt' || lower === 'option') {
      altKey = true
    } else if (lower === 'control' || lower === 'ctrl') {
      ctrlKey = true
    } else if (
      lower === 'commandorcontrol' ||
      lower === 'cmdorctrl' ||
      lower === 'command' ||
      lower === 'cmd' ||
      lower === 'super' ||
      lower === 'meta'
    ) {
      metaKey = true
    } else if (lower === 'shift') {
      shiftKey = true
    } else if (!MODIFIER_NAMES.has(part)) {
      primaryKeyName = part
    }
  }

  const primaryKeycode = KEYCODE_MAP[primaryKeyName]

  if (primaryKeycode == null) {
    throw new Error(`Unknown key name in accelerator: "${primaryKeyName}" (from "${accelerator}")`)
  }

  return { id: '', primaryKeycode, altKey, ctrlKey, metaKey, shiftKey }
}

const matchesModifiers = (event: UiohookKeyboardEvent, entry: ShortcutEntry): boolean => {
  return (
    event.altKey === entry.altKey &&
    event.ctrlKey === entry.ctrlKey &&
    event.metaKey === entry.metaKey &&
    event.shiftKey === entry.shiftKey
  )
}

export class GlobalHookService {
  private shortcuts = new Map<string, ShortcutEntry>()
  private heldPrimaryKeys = new Set<number>()
  private activeRecording: { shortcutId: string; primaryKeycode: number } | null = null
  private isRunning = false
  private getWindow: () => BrowserWindow | undefined | null
  private sendStartRecording: (window: BrowserWindow | null | undefined, shortcutId: string) => void
  private sendStopRecording: (window: BrowserWindow | null | undefined, shortcutId: string) => void

  constructor(options: {
    getWindow: () => BrowserWindow | undefined | null
    sendStartRecording: (window: BrowserWindow | null | undefined, shortcutId: string) => void
    sendStopRecording: (window: BrowserWindow | null | undefined, shortcutId: string) => void
  }) {
    this.getWindow = options.getWindow
    this.sendStartRecording = options.sendStartRecording
    this.sendStopRecording = options.sendStopRecording
  }

  register(id: string, accelerator: string): void {
    const entry = parseAccelerator(accelerator)
    entry.id = id
    this.shortcuts.set(id, entry)
    logger.info(`[GlobalHookService] Registered shortcut "${id}": ${accelerator}`, {
      keycode: entry.primaryKeycode,
      alt: entry.altKey,
      ctrl: entry.ctrlKey,
      meta: entry.metaKey,
      shift: entry.shiftKey,
    })
  }

  unregister(id: string): void {
    this.shortcuts.delete(id)
    if (this.activeRecording?.shortcutId === id) {
      this.stopActiveRecording()
    }
  }

  unregisterAll(): void {
    this.shortcuts.clear()
    if (this.activeRecording) {
      this.stopActiveRecording()
    }
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.heldPrimaryKeys.clear()
    this.activeRecording = null
    uIOhook.on('keydown', this.handleKeyDown)
    uIOhook.on('keyup', this.handleKeyUp)
    uIOhook.start()
    logger.info('[GlobalHookService] Started')
  }

  stop(): void {
    if (!this.isRunning) return
    this.isRunning = false
    uIOhook.stop()
    uIOhook.removeListener('keydown', this.handleKeyDown)
    uIOhook.removeListener('keyup', this.handleKeyUp)
    this.heldPrimaryKeys.clear()
    this.activeRecording = null
    logger.info('[GlobalHookService] Stopped')
  }

  getIsRunning(): boolean {
    return this.isRunning
  }

  private handleKeyDown = (event: UiohookKeyboardEvent): void => {
    if (this.isModifierKeycode(event.keycode)) {
      this.heldPrimaryKeys.forEach((keycode) => {
        this.tryStartFor(keycode, event)
      })
      return
    }

    this.heldPrimaryKeys.add(event.keycode)
    this.tryStartFor(event.keycode, event)
  }

  private handleKeyUp = (event: UiohookKeyboardEvent): void => {
    if (this.isModifierKeycode(event.keycode)) {
      return
    }

    this.heldPrimaryKeys.delete(event.keycode)

    if (this.activeRecording && this.activeRecording.primaryKeycode === event.keycode) {
      this.stopActiveRecording()
    }
  }

  private tryStartFor(keycode: number, event: UiohookKeyboardEvent): void {
    if (this.activeRecording) return

    for (const entry of this.shortcuts.values()) {
      if (entry.primaryKeycode === keycode && matchesModifiers(event, entry)) {
        this.activeRecording = { shortcutId: entry.id, primaryKeycode: entry.primaryKeycode }
        this.sendStartRecording(this.getWindow(), entry.id)
        return
      }
    }
  }

  private stopActiveRecording(): void {
    if (!this.activeRecording) return
    const { shortcutId } = this.activeRecording
    this.activeRecording = null
    this.sendStopRecording(this.getWindow(), shortcutId)
  }

  private isModifierKeycode(keycode: number): boolean {
    return MODIFIER_KEYCODES.has(keycode)
  }
}
