import { getAppInfo } from '@open-bisbis/ipc'
import { logger } from '@open-bisbis/logger'
import { useQuery } from '@tanstack/react-query'

export const useAppInfo = () => {
  return useQuery({
    queryKey: ['app-info'],
    queryFn: async () => {
      const result = await getAppInfo(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useAppInfo] Failed to fetch app info', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
  })
}
