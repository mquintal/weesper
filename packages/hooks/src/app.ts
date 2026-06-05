import { useQuery } from '@tanstack/react-query'
import { getAppInfo } from '@weesper/ipc'
import { logger } from '@weesper/logger'

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
