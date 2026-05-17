import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { logger } from '@open-bisbis/logger'
import { clipboard, systemPreferences } from 'electron'

const execAsync = promisify(exec)

export const pasteHandler = async (text: string) => {
  if (!text) return

  const oldClipboard = clipboard.readText()
  clipboard.writeText(text)

  if (process.platform === 'darwin') {
    // Check for accessibility permissions, prompting the user if not granted
    const isTrusted = systemPreferences.isTrustedAccessibilityClient(true)

    if (!isTrusted) {
      logger.warn('Accessibility permission not granted. Cannot paste text automatically.')
      throw new Error(
        'Accessibility permission is required to paste text automatically. Please grant it in System Settings > Privacy & Security > Accessibility.',
      )
    }

    try {
      // Simulate Command+V using AppleScript
      await execAsync('osascript -e \'tell application "System Events" to keystroke "v" using {command down}\'')

      // Give the system a moment to process the paste before restoring clipboard
      setTimeout(() => {
        if (clipboard.readText() === text) {
          clipboard.writeText(oldClipboard)
        }
      }, 500)
    } catch (error) {
      logger.error('Failed to paste via AppleScript:', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}
