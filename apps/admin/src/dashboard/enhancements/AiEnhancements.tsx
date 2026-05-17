import { useCreateShortcut, useDeleteShortcut, useShortcuts, useUpdateShortcut } from '@open-bisbis/hooks'
import type { CreateShortcut, Shortcut } from '@open-bisbis/ipc'
import { PlusIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { DeleteConfirmation, Header, QueryError, useToast } from '@/components'
import { ListAiEnhancements } from './ListAiEnhancements'
import { ModalAiEnhancement } from './ModalAiEnhancement'

type Props = {
  hasLlm: boolean
}

export const AiEnhancements = ({ hasLlm }: Props) => {
  const { data: items = [], isLoading, isError, refetch } = useShortcuts()
  const createShortcut = useCreateShortcut()
  const updateShortcut = useUpdateShortcut()
  const deleteShortcut = useDeleteShortcut()
  const { toast } = useToast()

  const [modalState, setModalState] = useState<{ mode: 'add' } | { mode: 'edit'; item: Shortcut } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleSave = (saved: CreateShortcut) => {
    if (modalState?.mode === 'edit') {
      updateShortcut.mutate(
        { id: modalState.item.id, shortcut: saved },
        {
          onError: () => toast('Failed to update AI Enhancement', 'error'),
        },
      )
    } else {
      createShortcut.mutate(saved, {
        onError: () => toast('Failed to create AI Enhancement', 'error'),
      })
    }
    setModalState(null)
  }

  const handleDeleteConfirm = () => {
    if (deleteId) {
      deleteShortcut.mutate(deleteId, {
        onError: () => toast('Failed to delete AI Enhancement', 'error'),
      })
      setDeleteId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <Header
          title="AI Enhancements"
          description="Use AI to enhance your transcriptions. Define AI-powered enhancements that process your transcriptions."
          variant="small"
        />

        {isError && <QueryError message="Failed to load AI Enhancements" onRetry={refetch} />}

        {!hasLlm && items.length > 0 && (
          <div role="alert" className="alert alert-warning alert-outline">
            <span>In order to use AI Enhancements, you need to have an AI Model selected.</span>
          </div>
        )}

        <ListAiEnhancements
          items={items}
          isLoading={isLoading}
          onEdit={(item) => setModalState({ mode: 'edit', item })}
          onDelete={(id) => setDeleteId(id)}
        />

        <button
          type="button"
          className="btn btn-ghost btn-primary btn-sm w-46"
          onClick={() => setModalState({ mode: 'add' })}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add AI Enhancement
        </button>
      </div>

      <ModalAiEnhancement
        isOpen={modalState !== null}
        initial={modalState?.mode === 'edit' ? modalState.item : undefined}
        items={items}
        onSave={handleSave}
        onClose={() => setModalState(null)}
      />

      <DeleteConfirmation
        isOpen={deleteId !== null}
        title="Delete AI Enhancement"
        description={`Are you sure you want to delete "${items.find((s) => s.id === deleteId)?.name}" AI Enhancement? This action cannot be undone.`}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  )
}
