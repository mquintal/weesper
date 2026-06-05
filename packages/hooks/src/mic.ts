import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMicInUse, setMicInUse } from '@weesper/ipc'

export const useMicSettings = () => {
  const client = useQueryClient()
  const queryKey = ['mic-settings']

  const { data: micInUse, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getMicInUse(window.ipcRenderer)
      if (result.status === 'error') {
        throw new Error(result.data.join('\n'))
      }
      return result.data
    },
    initialData: '',
  })

  const { mutate: onRequestSetMicInUse } = useMutation({
    mutationFn: async (id: string) => {
      const result = await setMicInUse(window.ipcRenderer, id)
      if (result.status === 'error') throw new Error(result.data.join('\n'))
      return result.data
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey })
    },
  })

  return { micInUse, setMicInUse: onRequestSetMicInUse, isLoading }
}
