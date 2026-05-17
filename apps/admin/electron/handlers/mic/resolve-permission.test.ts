import { describe, expect, it } from 'vitest'
import { type PermissionStatus, resolvePermission } from './resolve-permission'

describe('resolvePermission', () => {
  it('handles not-determined status with ask results', () => {
    expect(resolvePermission('not-determined', true)).toBe('granted')
    expect(resolvePermission('not-determined', false)).toBe('denied')
    expect(resolvePermission('not-determined', undefined)).toBe('idle')
  })

  it('maps direct statuses correctly', () => {
    expect(resolvePermission('granted')).toBe('granted')
    expect(resolvePermission('denied')).toBe('denied')
    expect(resolvePermission('restricted')).toBe('denied')
    expect(resolvePermission('unknown')).toBe('idle')
  })

  it('handles unexpected status by falling back to idle', () => {
    expect(resolvePermission('random' as PermissionStatus)).toBe('idle')
  })
})
