import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelDownloadLlm, deleteLlm, downloadLlm, getListLlms, selectLlm } from '@weesper/ipc'
import { logger } from '@weesper/logger'

export const useLlms = () => {
  return useQuery({
    queryKey: ['llms'],
    queryFn: async () => {
      const result = await getListLlms(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useLlms] Failed to fetch LLMs list', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
  })
}

export const useSelectLlm = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await selectLlm(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useSelectLlm] Failed to select LLM ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useSelectLlm] Successfully selected LLM ${id}`)
      queryClient.invalidateQueries({ queryKey: ['llms'] })
    },
  })
}

export const useDeleteLlm = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteLlm(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useDeleteLlm] Failed to delete LLM ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useDeleteLlm] Successfully deleted LLM ${id}`)
      queryClient.invalidateQueries({ queryKey: ['llms'] })
    },
  })
}

export const useDownloadLlm = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await downloadLlm(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useDownloadLlm] Failed to start download for LLM ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useDownloadLlm] Successfully started download for LLM ${id}`)
    },
  })
}

export const useCancelDownloadLlm = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await cancelDownloadLlm(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useCancelDownloadLlm] Failed to cancel download for LLM ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useCancelDownloadLlm] Successfully cancelled download for LLM ${id}`)
    },
  })
}
