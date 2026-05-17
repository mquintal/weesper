import { useEffect, useState } from 'react'

export const useRecordingManager = () => {
  const [state, setState] = useState({ isRecording: false, stream: null })

  useEffect(() => {
    const handler = (e: any) => {
      setState(e.detail)
    }
    window.addEventListener('mock-recording-manager', handler as any)
    return () => window.removeEventListener('mock-recording-manager', handler as any)
  }, [])

  return state
}
