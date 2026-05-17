import { useLlms, useShortcuts } from '@open-bisbis/hooks'
import { useMemo } from 'react'
import { Page, QueryError } from '@/components'
import { AiEnhancements } from './AiEnhancements'
import { LlmSection } from './LlmSection'
import { Onboarding } from './Onboarding'

export const Enhancements = () => {
  const { data: llms, isError: isLlmsError, refetch: refetchLlms } = useLlms()
  const { data: shortcuts, isError: isShortcutsError, refetch: refetchShortcuts } = useShortcuts()

  const hasLlm = useMemo(() => llms?.some((llm) => llm.isSelected) ?? false, [llms])
  const hasShortcuts = useMemo(() => (shortcuts?.length ?? 0) > 0, [shortcuts])

  const isError = isLlmsError || isShortcutsError
  const refetch = () => {
    refetchLlms()
    refetchShortcuts()
  }

  return (
    <Page title="Enhancements" description="Manage AI models and AI Enhancements that process your transcriptions">
      {isError && <QueryError message="Failed to load enhancement configurations" onRetry={refetch} />}
      <div className="flex flex-col gap-8">
        <Onboarding hasShortcuts={hasShortcuts} hasLlm={hasLlm} />
        <AiEnhancements hasLlm={hasLlm} />
        <LlmSection />
      </div>
    </Page>
  )
}
