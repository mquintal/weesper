import { stopRecording } from '@open-bisbis/ipc'
import { logger } from '@open-bisbis/logger'
import { useMutation } from '@tanstack/react-query'

export const useTranscribe = () => {
  const { mutateAsync: transcribe, isPending: transcribing } = useMutation({
    mutationFn: async (shortcutId: string) => {
      const result = await stopRecording(window.ipcRenderer, shortcutId)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useTranscribe] Failed to stop recording for shortcut ${shortcutId}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, shortcutId) => {
      logger.info(`[useTranscribe] Successfully triggered transcription for shortcut ${shortcutId}`)
    },
  })

  return { transcribe, transcribing }
}
