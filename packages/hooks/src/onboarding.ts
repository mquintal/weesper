import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAccessibilityGrant,
  getMicGrant,
  getOnboarded,
  postAccessibilityGrant,
  postMicGrant,
  postOnboarded,
} from '@weesper/ipc'
import { logger } from '@weesper/logger'

export const useMicGrant = () => {
  const client = useQueryClient()
  const queryKey = ['mic-grant']

  const { data: grant } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getMicGrant(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useMicGrant] Failed to fetch mic grant status', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    refetchInterval: (query) => (query.state.data === 'granted' ? false : 1000),
  })

  const { mutate: onRequestMicPermission } = useMutation({
    mutationFn: async () => {
      const result = await postMicGrant(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useMicGrant] Failed to request mic permission', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: () => {
      logger.info('[useMicGrant] Successfully requested mic permission')
      client.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      logger.error('[useMicGrant] Error during mic permission mutation', { error: error.message })
      client.invalidateQueries({ queryKey })
    },
  })

  return { grant, onRequestMicPermission }
}

export const useAccessibilityGrant = () => {
  const client = useQueryClient()
  const queryKey = ['accessibility-grant']

  const { data: grant } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getAccessibilityGrant(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useAccessibilityGrant] Failed to fetch accessibility grant status', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    refetchInterval: (query) => (query.state.data ? false : 1000),
  })

  const { mutate: onRequestPermission } = useMutation({
    mutationFn: async () => {
      const result = await postAccessibilityGrant(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useAccessibilityGrant] Failed to request accessibility permission', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: () => {
      logger.info('[useAccessibilityGrant] Successfully requested accessibility permission')
      client.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      logger.error('[useAccessibilityGrant] Error during accessibility permission mutation', { error: error.message })
      client.invalidateQueries({ queryKey })
    },
  })

  return { grant, onRequestPermission }
}

export const useOnboarding = () => {
  const { grant: accessibilityGrant } = useAccessibilityGrant()
  const { grant: micGrant } = useMicGrant()

  const client = useQueryClient()
  const queryKey = ['onboard']

  const { data: hasOnBoarded } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getOnboarded(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useOnboarding] Failed to fetch onboarding status', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
  })

  const { mutate } = useMutation({
    mutationFn: async () => {
      const result = await postOnboarded(window.ipcRenderer)
      if (result.status === 'error') {
        const errorMsg = result.data.join('\n')
        logger.error('[useOnboarding] Failed to mark onboarding as completed', { error: errorMsg })
        throw new Error(errorMsg)
      }
      return result.data
    },
    onSuccess: () => {
      logger.info('[useOnboarding] Successfully completed onboarding')
      client.invalidateQueries({ queryKey })
    },
    onError: (error) => {
      logger.error('[useOnboarding] Error during onboarding completion mutation', { error: error.message })
      client.invalidateQueries({ queryKey })
    },
  })

  return {
    canContinue: !!accessibilityGrant && micGrant === 'granted',
    hasOnBoarded,
    doContinue: mutate,
  }
}
