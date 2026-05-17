import { useAccessibilityGrant } from '@open-bisbis/hooks'
import { PermissionGrantCard } from './PermissionGrantCard'

export const AccessibilityGrant = () => {
  const { grant, onRequestPermission } = useAccessibilityGrant()

  return (
    <PermissionGrantCard
      status={grant ? 'granted' : 'prompt'}
      icon={
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path
            fillRule="evenodd"
            d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
            clipRule="evenodd"
          />
        </svg>
      }
      title="Accessibility"
      description={grant ? 'Access granted' : 'Required for auto-paste'}
      actionLabel="Allow"
      onAction={onRequestPermission}
      infoMessage={
        !grant
          ? 'Open Bisbis needs this permission to simulate keystrokes and insert transcriptions directly into your active window.'
          : undefined
      }
    />
  )
}
