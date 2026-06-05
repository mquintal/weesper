import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteRecording, getListRecordings, getRecording } from '@weesper/ipc'
import { logger } from '@weesper/logger'

export const useRecordings = () => {
  return useQuery({
    queryKey: ['recordings'],
    queryFn: async () => {
      const result = await getListRecordings(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useRecordings] Failed to fetch recordings', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
  })
}

export const useRecording = (id?: string) => {
  return useQuery({
    queryKey: ['recording', id],
    queryFn: async () => {
      if (!id) return undefined
      const result = await getRecording(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useRecording] Failed to fetch recording ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    enabled: !!id,
  })
}

export const useDeleteRecording = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteRecording(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useDeleteRecording] Failed to delete recording ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useDeleteRecording] Successfully deleted recording ${id}`)
      queryClient.invalidateQueries({ queryKey: ['recordings'] })
    },
  })
}
