import { describe, expect, it } from 'vitest'
import { toElectronShortcut, toUIShortcut } from './mapping'

describe('shortcuts mapping', () => {
  describe('toElectronShortcut', () => {
    it('maps single modifiers', () => {
      expect(toElectronShortcut('⌘')).toBe('CommandOrControl')
      expect(toElectronShortcut('⌥')).toBe('Alt')
      expect(toElectronShortcut('⌃')).toBe('Control')
      expect(toElectronShortcut('⇧')).toBe('Shift')
    })

    it('maps combinations', () => {
      expect(toElectronShortcut('⌘ + R')).toBe('CommandOrControl+R')
      expect(toElectronShortcut('⌘ + ⌥ + R')).toBe('CommandOrControl+Alt+R')
      expect(toElectronShortcut('⌘ + ⌥ + ⇧ + R')).toBe('CommandOrControl+Alt+Shift+R')
    })

    it('maps special keys', () => {
      expect(toElectronShortcut('⌘ + ↑')).toBe('CommandOrControl+Up')
      expect(toElectronShortcut('⌘ + ESC')).toBe('CommandOrControl+Escape')
      expect(toElectronShortcut('⌘ + SPACE')).toBe('CommandOrControl+Space')
    })

    it('leaves unknown keys as is', () => {
      expect(toElectronShortcut('⌘ + F12')).toBe('CommandOrControl+F12')
    })
  })

  describe('toUIShortcut', () => {
    it('maps single modifiers with aliases', () => {
      expect(toUIShortcut('CommandOrControl')).toBe('⌘')
      expect(toUIShortcut('CmdOrCtrl')).toBe('⌘')
      expect(toUIShortcut('Command')).toBe('⌘')
      expect(toUIShortcut('Cmd')).toBe('⌘')
      expect(toUIShortcut('Alt')).toBe('⌥')
      expect(toUIShortcut('Option')).toBe('⌥')
      expect(toUIShortcut('Control')).toBe('⌃')
      expect(toUIShortcut('Ctrl')).toBe('⌃')
      expect(toUIShortcut('Shift')).toBe('⇧')
    })

    it('maps combinations', () => {
      expect(toUIShortcut('CommandOrControl+Alt+R')).toBe('⌘ + ⌥ + R')
    })

    it('is case insensitive', () => {
      expect(toUIShortcut('commandorcontrol+alt+r')).toBe('⌘ + ⌥ + R')
    })

    it('uppercases regular keys', () => {
      expect(toUIShortcut('CommandOrControl+r')).toBe('⌘ + R')
    })

    it('maps special keys', () => {
      expect(toUIShortcut('CommandOrControl+Up')).toBe('⌘ + ↑')
      expect(toUIShortcut('CommandOrControl+Escape')).toBe('⌘ + ESC')
      expect(toUIShortcut('CommandOrControl+Space')).toBe('⌘ + SPACE')
    })
  })

  describe('roundtrip', () => {
    it('preserves mapping', () => {
      const ui = '⌘ + ⌥ + R'
      expect(toUIShortcut(toElectronShortcut(ui))).toBe(ui)
    })
  })
})
