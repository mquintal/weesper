import { cancelDownloadModel, deleteModel, downloadModel, getListModels, selectModel } from '@open-bisbis/ipc'
import { logger } from '@open-bisbis/logger'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useModels = () => {
  return useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const result = await getListModels(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useModels] Failed to fetch models list', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
  })
}

export const useSelectModel = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, language }: { id: string; language: string }) => {
      const result = await selectModel(window.ipcRenderer, id, language)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useSelectModel] Failed to select model ${id} for language ${language}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, { id, language }) => {
      logger.info(`[useSelectModel] Successfully selected model ${id} for language ${language}`)
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
  })
}

export const useDeleteModel = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteModel(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useDeleteModel] Failed to delete model ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useDeleteModel] Successfully deleted model ${id}`)
      queryClient.invalidateQueries({ queryKey: ['models'] })
    },
  })
}

export const useDownloadModel = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await downloadModel(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useDownloadModel] Failed to start download for model ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useDownloadModel] Successfully started download for model ${id}`)
    },
  })
}

export const useCancelDownloadModel = () => {
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await cancelDownloadModel(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useCancelDownloadModel] Failed to cancel download for model ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useCancelDownloadModel] Successfully cancelled download for model ${id}`)
    },
  })
}
