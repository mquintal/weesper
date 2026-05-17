export type PermissionStatus = 'not-determined' | 'granted' | 'denied' | 'restricted' | 'unknown'

/**
 * Resolves the final permission status based on the system status and optional ask result.
 */
export const resolvePermission = (status: PermissionStatus, askResult?: boolean): 'granted' | 'denied' | 'idle' => {
  if (status === 'not-determined') {
    if (askResult === undefined) return 'idle'
    return askResult ? 'granted' : 'denied'
  }

  const mapStatus: Record<string, 'granted' | 'denied' | 'idle'> = {
    granted: 'granted',
    denied: 'denied',
    restricted: 'denied',
    unknown: 'idle',
  }

  return mapStatus[status] || 'idle'
}
