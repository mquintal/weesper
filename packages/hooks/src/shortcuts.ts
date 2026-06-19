import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  type CreateShortcut,
  createShortcut,
  deleteShortcut,
  getDefaultShortcut,
  getListShortcuts,
  getShortcutMode,
  type ShortcutMode,
  setDefaultShortcut,
  setShortcutMode,
  updateShortcut,
} from '@weesper/ipc'
import { logger } from '@weesper/logger'

export const useDefaultShortcut = () => {
  return useQuery({
    queryKey: ['shortcuts', 'default'],
    queryFn: async () => {
      const result = await getDefaultShortcut(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useDefaultShortcut] Failed to fetch default shortcut', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
  })
}

export const useSetDefaultShortcut = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shortcut: string) => {
      const result = await setDefaultShortcut(window.ipcRenderer, shortcut)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useSetDefaultShortcut] Failed to set default shortcut to ${shortcut}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, shortcut) => {
      logger.info(`[useSetDefaultShortcut] Successfully set default shortcut to ${shortcut}`)
      queryClient.invalidateQueries({ queryKey: ['shortcuts', 'default'] })
    },
  })
}

export const useShortcuts = () => {
  return useQuery({
    queryKey: ['shortcuts', 'list'],
    queryFn: async () => {
      const result = await getListShortcuts(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useShortcuts] Failed to fetch shortcuts list', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
  })
}

export const useCreateShortcut = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (shortcut: CreateShortcut) => {
      const result = await createShortcut(window.ipcRenderer, shortcut)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useCreateShortcut] Failed to create shortcut ${shortcut.name}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, shortcut) => {
      logger.info(`[useCreateShortcut] Successfully created shortcut ${shortcut.name}`)
      queryClient.invalidateQueries({ queryKey: ['shortcuts', 'list'] })
    },
  })
}

export const useUpdateShortcut = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, shortcut }: { id: string; shortcut: CreateShortcut }) => {
      const result = await updateShortcut(window.ipcRenderer, id, shortcut)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useUpdateShortcut] Failed to update shortcut ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, { id }) => {
      logger.info(`[useUpdateShortcut] Successfully updated shortcut ${id}`)
      queryClient.invalidateQueries({ queryKey: ['shortcuts', 'list'] })
    },
  })
}

export const useShortcutMode = () => {
  return useQuery({
    queryKey: ['shortcuts', 'mode'],
    queryFn: async () => {
      const result = await getShortcutMode(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useShortcutMode] Failed to fetch shortcut mode', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
  })
}

export const useSetShortcutMode = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (mode: ShortcutMode) => {
      const result = await setShortcutMode(window.ipcRenderer, mode)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useSetShortcutMode] Failed to set shortcut mode to ${mode}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, mode) => {
      logger.info(`[useSetShortcutMode] Successfully set shortcut mode to ${mode}`)
      queryClient.invalidateQueries({ queryKey: ['shortcuts', 'mode'] })
    },
  })
}

export const useDeleteShortcut = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteShortcut(window.ipcRenderer, id)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error(`[useDeleteShortcut] Failed to delete shortcut ${id}`, { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: (_, id) => {
      logger.info(`[useDeleteShortcut] Successfully deleted shortcut ${id}`)
      queryClient.invalidateQueries({ queryKey: ['shortcuts', 'list'] })
    },
  })
}
