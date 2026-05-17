import { useDeleteRecording, useRecordings } from '@open-bisbis/hooks'
import { CookieIcon, EyeOpenIcon, TrashIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { useState } from 'react'
import { DeleteConfirmation, Page, QueryError } from '@/components'
import { formatDuration } from '@/utils/format'
import { RecordingModal } from './RecordingModal'

export const Recordings = () => {
  const { data: recordings, isError, refetch } = useRecordings()
  const { mutateAsync: deleteRecording } = useDeleteRecording()
  const [selectedRecordingId, setSelectedRecordingId] = useState<string | null>(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState<string | null>(null)

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmationOpen(id)
  }

  const confirmDelete = async () => {
    setDeleteConfirmationOpen(null)
    if (deleteConfirmationOpen) {
      await deleteRecording(deleteConfirmationOpen)
    }
  }

  return (
    <Page title="Recordings" description="View and manage your past recordings and transcriptions.">
      {isError && <QueryError message="Failed to load recordings" onRetry={refetch} />}

      <div className="bg-base-100 rounded-box border border-base-content/10 overflow-hidden">
        {recordings?.length === 0 ? (
          <div className="text-center py-12 text-base-content/50">No recordings found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full table-pin-rows">
              <thead>
                <tr>
                  <th className="w-6"></th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recordings?.map((recording) => (
                  <tr
                    key={recording.id}
                    className="hover:cursor-pointer hover:bg-base-200"
                    onClick={() => setSelectedRecordingId(recording.id)}
                  >
                    <td>
                      <div
                        className="px-2 tooltip tooltip-right"
                        data-tip={
                          recording.transcribedText
                            ? recording.transcribedText.split(/\s+/).slice(0, 20).join(' ') +
                              (recording.transcribedText.split(/\s+/).length > 20 ? '...' : '')
                            : 'No transcription'
                        }
                      >
                        <CookieIcon className="w-4 h-4 text-base-content/50" />
                      </div>
                    </td>
                    <td>{format(new Date(recording.createdAt), 'MMM d, h:mm:ss a')}</td>
                    <td>{formatDuration(recording.duration)}</td>
                    <td>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-square hover:text-primary"
                          aria-label="View recording"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRecordingId(recording.id)
                          }}
                        >
                          <EyeOpenIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm btn-square hover:text-error"
                          onClick={(e) => handleDelete(recording.id, e)}
                          aria-label="Delete recording"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <DeleteConfirmation
        title="Delete Recording"
        description="Are you sure you want to delete this recording?"
        onConfirm={confirmDelete}
        isOpen={!!deleteConfirmationOpen}
        onClose={() => setDeleteConfirmationOpen(null)}
      />
      <RecordingModal recordingId={selectedRecordingId} onClose={() => setSelectedRecordingId(null)} />
    </Page>
  )
}
