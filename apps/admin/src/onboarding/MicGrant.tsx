import { useMicGrant } from '@open-bisbis/hooks'
import { PermissionGrantCard } from './PermissionGrantCard'

export const MicGrant = () => {
  const { grant, onRequestMicPermission } = useMicGrant()

  const requestMicPermission = async () => {
    try {
      onRequestMicPermission()
    } catch (err) {
      console.error('Mic access denied:', err)
    }
  }

  return (
    <PermissionGrantCard
      status={grant === 'granted' ? 'granted' : grant === 'denied' ? 'denied' : 'prompt'}
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 01-7.5 0V4.5z" />
          <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.85v2.9h2.25a.75.75 0 010 1.5H9a.75.75 0 010-1.5h2.25v-2.9c-3.392-.596-6-3.46-6-6.85v-1.5a.75.75 0 01.75-.75z" />
        </svg>
      }
      title="Microphone"
      description={
        grant === 'granted' ? 'Access granted' : grant === 'denied' ? 'Access denied' : 'Required to capture your voice'
      }
      actionLabel={grant === 'denied' ? 'Retry' : 'Allow'}
      onAction={requestMicPermission}
      infoMessage={
        grant === 'denied' ? (
          <>
            Please open{' '}
            <span className="font-semibold">System Settings &gt; Privacy &amp; Security &gt; Microphone</span> and
            enable access for Open Bisbis.
          </>
        ) : undefined
      }
    />
  )
}
