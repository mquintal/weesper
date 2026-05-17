import {
  getAccessibilityGrant,
  getMicGrant,
  getOnboarded,
  postAccessibilityGrant,
  postMicGrant,
  postOnboarded,
} from '@open-bisbis/ipc'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useMicGrant = () => {
  const client = useQueryClient()
  const queryKey = ['mic-grant']

  const { data: grant } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getMicGrant(window.ipcRenderer)
      if (result.status === 'error') {
        throw new Error(result.data.join('\n'))
      }
      return result.data
    },
    refetchInterval: (query) => (query.state.data === 'granted' ? false : 1000),
  })

  const { mutate: onRequestMicPermission } = useMutation({
    mutationFn: async () => {
      const result = await postMicGrant(window.ipcRenderer)
      if (result.status === 'error') {
        throw new Error(result.data.join('\n'))
      }
      return result.data
    },
    onSuccess: () => client.invalidateQueries({ queryKey }),
    onError: () => client.invalidateQueries({ queryKey }),
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
        throw new Error(result.data.join('\n'))
      }
      return result.data
    },
    refetchInterval: (query) => (query.state.data ? false : 1000),
  })

  const { mutate: onRequestPermission } = useMutation({
    mutationFn: async () => {
      const result = await postAccessibilityGrant(window.ipcRenderer)
      if (result.status === 'error') {
        throw new Error(result.data.join('\n'))
      }
      return result.data
    },
    onSuccess: () => client.invalidateQueries({ queryKey }),
    onError: () => client.invalidateQueries({ queryKey }),
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
        throw new Error(result.data.join('\n'))
      }
      return result.data
    },
  })

  const { mutate } = useMutation({
    mutationFn: async () => {
      const result = await postOnboarded(window.ipcRenderer)
      if (result.status === 'error') {
        throw new Error(result.data.join('\n'))
      }
      return result.data
    },
    onSuccess: () => client.invalidateQueries({ queryKey }),
    onError: () => client.invalidateQueries({ queryKey }),
  })

  return {
    canContinue: !!accessibilityGrant && micGrant === 'granted',
    hasOnBoarded,
    doContinue: mutate,
  }
}
