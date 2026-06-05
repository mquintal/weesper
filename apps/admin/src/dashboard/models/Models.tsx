import { useDeleteModel, useModels, useSelectModel } from '@weesper/hooks'
import { useEffect, useMemo, useState } from 'react'
import { DeleteConfirmation, Page, QueryError, useToast } from '@/components'
import { Model } from './Model'

export const Models = () => {
  const [pinnedId, setPinnedId] = useState<string | undefined>()
  const [modelToDelete, setModelToDelete] = useState('')
  const { data: models, isError, isLoading, refetch } = useModels()
  const { toast } = useToast()

  useEffect(() => {
    if (models && pinnedId === undefined) {
      const selected = models.find((m: any) => m.isSelected)
      setPinnedId(selected?.id || '')
    }
  }, [models, pinnedId])

  const sortedModels = useMemo(() => {
    if (!models) return []
    return [...models].sort((a, b) => {
      if (a.id === pinnedId) return -1
      if (b.id === pinnedId) return 1
      return 0
    })
  }, [models, pinnedId])

  const selectModelMutation = useSelectModel()
  const deleteModelMutation = useDeleteModel()

  const handleSelect = async (id: string, language: string) => {
    selectModelMutation.mutate(
      { id, language },
      {
        onError: () => toast('Failed to select model', 'error'),
      },
    )
  }

  const handleDeleteConfirm = async () => {
    if (modelToDelete) {
      deleteModelMutation.mutate(modelToDelete, {
        onSuccess: () => {
          setModelToDelete('')
        },
        onError: () => toast('Failed to delete model', 'error'),
      })
    }
  }

  const handleDelete = (id: string) => {
    setModelToDelete(id)
  }

  return (
    <Page title="Models" description="Manage and download Whisper speech-to-text models for audio transcription">
      {isError && <QueryError message="Failed to load models" onRetry={refetch} />}
      {isLoading && <p>loading...</p>}
      <div className="models-grid">
        {sortedModels.map((model: any) => (
          <Model
            key={model.id}
            id={model.id}
            name={model.name}
            size={model.size}
            accuracy={model.accuracy}
            speed={model.speed}
            isDownloaded={model.isDownloaded}
            isSelected={model.isSelected}
            language={model?.language ?? 'en'}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <DeleteConfirmation
        isOpen={!!modelToDelete}
        title="Delete Model"
        description="Are you sure you want to delete this model?"
        onClose={() => setModelToDelete('')}
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
    </Page>
  )
}
