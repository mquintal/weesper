import { Cross1Icon, CubeIcon } from '@radix-ui/react-icons'
import { useCancelDownloadModel, useDownloadModel, useModels } from '@weesper/hooks'
import { listenForDownloadProgress } from '@weesper/ipc'
import classNames from 'classnames'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { QueryError, useToast } from '@/components'
import { formatSize } from '@/utils/format'

type Props = {
  selectedModelId: string
  onSelect: (id: string) => void
}

export const Models = ({ selectedModelId, onSelect }: Props) => {
  const { data: models = [], isError, refetch } = useModels()
  const { mutate: downloadModel } = useDownloadModel()
  const { mutate: cancelDownload } = useCancelDownloadModel()
  const { toast } = useToast()
  const [progress, setProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    const unsubscribe = listenForDownloadProgress(window.ipcRenderer, (data) => {
      setProgress((prev) => ({ ...prev, [data.id]: data.percentage }))
      if (data.state === 'finished') {
        onSelect(data.id)
        refetch()
        setProgress((prev) => {
          const next = { ...prev }
          delete next[data.id]
          return next
        })
      }
      if (data.state === 'error') {
        setProgress((prev) => {
          const next = { ...prev }
          delete next[data.id]
          return next
        })
        refetch()
      }
    })
    return () => {
      unsubscribe()
    }
  }, [onSelect, refetch])

  const isAnyDownloading = Object.values(progress).some((p) => p < 100)

  const getModelStatus = useCallback(
    (id: string) => {
      const model = models.find((m) => m.id === id)
      if (model?.isDownloaded) return 'downloaded'
      if (progress[id] !== undefined && progress[id] < 100) return 'downloading'
      return 'not-downloaded'
    },
    [models, progress],
  )

  const handleModelClick = (id: string) => {
    const status = getModelStatus(id)
    if (status === 'downloaded') {
      onSelect(id)
    } else if (status === 'not-downloaded' && !isAnyDownloading) {
      downloadModel(id, {
        onError: () => toast('Failed to start download', 'error'),
      })
      // Start progress at 0% manually
      setProgress((prev) => ({ ...prev, [id]: 0 }))
    }
  }

  const handleCancelDownload = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    cancelDownload(id, {
      onSuccess: () => {
        setProgress((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        refetch()
      },
      onError: () => toast('Failed to cancel download', 'error'),
    })
  }

  const listedModels = useMemo(() => {
    return ['whisper-ggml-tiny', 'whisper-ggml-large-v3-turbo-q5_0'].map((id) => {
      const status = getModelStatus(id)
      const isSelected = selectedModelId === id
      const currentProgress = progress[id] || 0
      const model = models.find((m) => m.id === id)
      const isDownloadingThis = status === 'downloading'
      const isDisabled = isAnyDownloading && !isDownloadingThis
      const name = id === 'whisper-ggml-tiny' ? 'Tiny' : 'Turbo'
      const description = id === 'whisper-ggml-tiny' ? 'Fastest' : 'Most Accurate'
      const badge =
        id === 'whisper-ggml-large-v3-turbo-q5_0' ? (
          <div key="recommended" className="badge badge-soft badge-primary badge-xs">
            Recommended
          </div>
        ) : (
          <div key="faster-download" className="badge badge-soft badge-xs">
            Faster Download
          </div>
        )

      return {
        id,
        name,
        description,
        status,
        isSelected,
        currentProgress,
        size: model?.size,
        isDownloadingThis,
        isDisabled,
        badge,
      }
    })
  }, [models, isAnyDownloading, progress, selectedModelId, getModelStatus])

  return (
    <div className="flex flex-col gap-1 form-control w-full">
      <label className="label">
        <span className="label-text font-medium text-base-content/70">Speech to Text Model</span>
      </label>
      {isError && <QueryError message="Failed to load models" onRetry={refetch} />}
      <div className="grid grid-cols-2 gap-3">
        {listedModels.map((model) => (
          <Model
            key={model.id}
            name={model.name}
            description={model.description}
            status={model.status}
            isSelected={model.isSelected}
            currentProgress={model.currentProgress}
            size={model.size}
            isDownloadingThis={model.isDownloadingThis}
            isDisabled={model.isDisabled}
            badge={model.badge}
            onClick={() => handleModelClick(model.id)}
            onCancel={(e) => handleCancelDownload(e, model.id)}
          />
        ))}
      </div>
    </div>
  )
}

type ModelProps = {
  name: string
  description: string
  status: string
  isSelected: boolean
  currentProgress: number
  size?: number
  isDownloadingThis: boolean
  isDisabled: boolean
  badge: React.ReactNode
  onClick: () => void
  onCancel: (e: React.MouseEvent) => void
}

const Model = ({
  name,
  description,
  status,
  isSelected,
  currentProgress,
  size,
  isDownloadingThis,
  isDisabled,
  badge,
  onClick,
  onCancel,
}: ModelProps) => {
  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={classNames(
        'group relative flex flex-col gap-1 items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 overflow-hidden',
        {
          'border-primary bg-primary/5 ring-1 ring-primary': isSelected,
          'border-base-300 bg-base-100 hover:border-base-content/20': !isSelected,
          'hover:cursor-pointer hover:shadow-md': !isSelected && !isDownloadingThis && !isDisabled,
          'cursor-default': isDownloadingThis,
          'opacity-50 cursor-not-allowed': isDisabled,
        },
      )}
    >
      {badge}
      {isDownloadingThis && (
        <>
          <div
            className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300"
            style={{ width: `${currentProgress}%` }}
          />
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-2 right-2 btn btn-circle btn-xs btn-ghost hover:text-error opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
            title="Cancel Download"
          >
            <Cross1Icon className="w-3 h-3" />
          </button>
        </>
      )}

      <span
        className={classNames('font-bold', {
          'text-primary': isSelected,
          'text-base-content/70': !isSelected,
        })}
      >
        {name}
      </span>
      <span className="text-[10px] uppercase tracking-tighter opacity-50 font-semibold text-center">
        {isDownloadingThis ? `Downloading ${currentProgress}%` : description}
      </span>
      {status !== 'downloading' && size ? (
        <div className="flex h-3 items-center gap-1">
          <CubeIcon className="w-3 text-gray-400" />
          <span className="text-[10px] text-gray-400">{formatSize(size)}</span>
        </div>
      ) : (
        <div className="h-3" />
      )}

      {status === 'downloaded' && !isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 rounded-full bg-success" />
        </div>
      )}
    </button>
  )
}
