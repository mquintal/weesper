import Store from 'electron-store'

const store = new Store<{
  micGrant: 'idle' | 'granted' | 'denied'
  micInUse?: string
  hasOnboarded: boolean
  selectedModel?: {
    id: string
    language: string
  }
  selectedLlm?: string
  downloadedModels: Record<string, string>
  downloadedLlms: Record<string, string>
}>({
  name: 'open-bisbis',
  defaults: {
    micGrant: 'idle',
    micInUse: '',
    hasOnboarded: false,
    downloadedModels: {},
    downloadedLlms: {},
  },
})

export const isOnboarded = () => store.get('hasOnboarded')
export const setIsOnboarded = () => store.set('hasOnboarded', true)
export const getMicGrant = () => store.get('micGrant')
export const setMicGrant = (grant: 'idle' | 'granted' | 'denied') => store.set('micGrant', grant)
export const getSelectedModel = () => store.get('selectedModel')
export const setSelectedModel = (id: string, language: string) => store.set('selectedModel', { id, language })

export const getSelectedLlm = () => store.get('selectedLlm')
export const setSelectedLlm = (id: string) => store.set('selectedLlm', id)

export const getMicInUse = () => store.get('micInUse')
export const setMicInUse = (id: string) => store.set('micInUse', id)

export const getDownloadedModelHash = (id: string) => store.get('downloadedModels')[id] ?? ''
export const setDownloadedModelHash = (id: string, hash: string) => {
  const downloadedModels = store.get('downloadedModels')
  downloadedModels[id] = hash
  store.set('downloadedModels', downloadedModels)
}
export const removeDownloadedModelHash = (id: string) => {
  const downloadedModels = store.get('downloadedModels')
  delete downloadedModels[id]
  store.set('downloadedModels', downloadedModels)
}

export const getDownloadedLlmHash = (id: string) => store.get('downloadedLlms')[id] ?? ''
export const setDownloadedLlmHash = (id: string, hash: string) => {
  const downloadedLlms = store.get('downloadedLlms')
  downloadedLlms[id] = hash
  store.set('downloadedLlms', downloadedLlms)
}
export const removeDownloadedLlmHash = (id: string) => {
  const downloadedLlms = store.get('downloadedLlms')
  delete downloadedLlms[id]
  store.set('downloadedLlms', downloadedLlms)
}
export { store }
