import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import * as ipc from '@weesper/ipc'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOnboarding } from './onboarding'

vi.mock('@weesper/ipc', () => ({
  getAccessibilityGrant: vi.fn(),
  getMicGrant: vi.fn(),
  getOnboarded: vi.fn(),
  postAccessibilityGrant: vi.fn(),
  postMicGrant: vi.fn(),
  postOnboarded: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // @ts-expect-error
    window.ipcRenderer = {
      invoke: vi.fn(),
      on: vi.fn(),
      send: vi.fn(),
    } as any
  })

  it('should return canContinue as true when both grants are given', async () => {
    vi.mocked(ipc.getAccessibilityGrant).mockResolvedValue({ status: 'success', data: true })
    vi.mocked(ipc.getMicGrant).mockResolvedValue({ status: 'success', data: 'granted' })
    vi.mocked(ipc.getOnboarded).mockResolvedValue({ status: 'success', data: false })

    const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.canContinue).toBe(true)
    })
  })

  it('should return canContinue as false when accessibility grant is missing', async () => {
    vi.mocked(ipc.getAccessibilityGrant).mockResolvedValue({ status: 'success', data: false })
    vi.mocked(ipc.getMicGrant).mockResolvedValue({ status: 'success', data: 'granted' })
    vi.mocked(ipc.getOnboarded).mockResolvedValue({ status: 'success', data: false })

    const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.canContinue).toBe(false)
    })
  })

  it('should return canContinue as false when mic grant is not granted', async () => {
    vi.mocked(ipc.getAccessibilityGrant).mockResolvedValue({ status: 'success', data: true })
    vi.mocked(ipc.getMicGrant).mockResolvedValue({ status: 'success', data: 'denied' })
    vi.mocked(ipc.getOnboarded).mockResolvedValue({ status: 'success', data: false })

    const { result } = renderHook(() => useOnboarding(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.canContinue).toBe(false)
    })
  })
})
