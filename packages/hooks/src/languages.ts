import { getListLanguages } from '@open-bisbis/ipc'
import { useQuery } from '@tanstack/react-query'

export const useLanguages = () => {
  return useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const result = await getListLanguages(window.ipcRenderer)

      if (result.status === 'error') {
        throw new Error(result.data.join('\n'))
      }

      return result.data
    },
  })
}
