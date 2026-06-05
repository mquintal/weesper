import { useLlms, useShortcuts } from '@weesper/hooks'
import { useMemo } from 'react'
import { Page, QueryError } from '@/components'
import { AiEnhancements } from './AiEnhancements'
import { LlmSection } from './LlmSection'

export const Enhancements = () => {
  const { data: llms, isError: isLlmsError, refetch: refetchLlms } = useLlms()
  const { isError: isShortcutsError, refetch: refetchShortcuts } = useShortcuts()

  const hasLlm = useMemo(() => llms?.some((llm) => llm.isSelected) ?? false, [llms])

  const isError = isLlmsError || isShortcutsError
  const refetch = () => {
    refetchLlms()
    refetchShortcuts()
  }

  return (
    <Page title="Enhancements" description="Manage AI models and AI Enhancements that process your transcriptions">
      {isError && <QueryError message="Failed to load enhancement configurations" onRetry={refetch} />}
      <div className="flex flex-col gap-8">
        <AiEnhancements hasLlm={hasLlm} />
        <LlmSection />
      </div>
    </Page>
  )
}
