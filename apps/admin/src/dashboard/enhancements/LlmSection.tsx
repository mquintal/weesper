import { useDeleteLlm, useLlms } from '@weesper/hooks'
import { useCallback, useState } from 'react'
import { DeleteConfirmation, Header, QueryError, useToast } from '@/components'
import { Llm } from './Llm'
import { useDownloadsFinish } from './useDownloadsFinish'

export const LlmSection = () => {
  const { data: llms, isError, refetch: refetchLlms } = useLlms()
  const deleteLlmMutation = useDeleteLlm()
  const { toast } = useToast()

  const [llmToDelete, setLlmToDelete] = useState('')

  const handleDeleteLlm = (id: string) => {
    setLlmToDelete(id)
  }

  const handleDeleteConfirm = async () => {
    if (llmToDelete) {
      deleteLlmMutation.mutate(llmToDelete, {
        onSuccess: () => {
          setLlmToDelete('')
        },
        onError: () => toast('Failed to delete model', 'error'),
      })
    }
  }

  useDownloadsFinish(
    useCallback(() => {
      refetchLlms()
    }, [refetchLlms]),
  )

  return (
    <div className="flex flex-col gap-2">
      <Header
        title="AI Models"
        description="Select and download AI Models that will be used to enhance your transcriptions"
        variant="small"
      />

      {isError && <QueryError message="Failed to load enhancement models" onRetry={refetchLlms} />}

      <div className="models-grid">
        {llms?.map((llm: any) => (
          <Llm
            key={llm.id}
            id={llm.id}
            name={llm.name}
            size={llm.size}
            isDownloaded={llm.isDownloaded}
            isSelected={llm.isSelected}
            onDelete={handleDeleteLlm}
          />
        ))}
      </div>

      <DeleteConfirmation
        isOpen={!!llmToDelete}
        title="Delete Model"
        description="Are you sure you want to delete this model?"
        onClose={() => setLlmToDelete('')}
        onConfirm={handleDeleteConfirm}
      />

      <style>{`
        .models-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 24px;
          width: 100%;
        }
      `}</style>
    </div>
  )
}
