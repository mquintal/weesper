import { CrossCircledIcon, CubeIcon, DownloadIcon } from '@radix-ui/react-icons'
import { formatSize } from '@/utils/format'

type Props = {
  size: number
  downloadProgress?: number
  isDownloaded?: boolean
  onDelete?: () => void
  onCancel?: () => void
  onDownload: () => void
}

export const CardFooter = ({ size, downloadProgress, isDownloaded, onDelete, onCancel, onDownload }: Props) => {
  const isDownloading = !!onCancel

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    onCancel?.()
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload()
  }

  return (
    <div className="flex items-center justify-between gap-6 w-full">
      <div className="flex items-center gap-1 font-medium">
        <CubeIcon className="text-gray-400" />
        <span className="text-xs text-gray-400">{formatSize(size)}</span>
      </div>

      {!!onCancel && downloadProgress !== null && (
        <div className="flex items-center flex-grow-1 gap-2">
          <span className="text-xs opacity-50">Downloading</span>
          <progress className="progress progress-primary w-full min-w-12" value={downloadProgress} max="100"></progress>
          <span className="text-xs opacity-50 font-mono">{Math.min(100, downloadProgress ?? 0)}%</span>
        </div>
      )}
      {!isDownloaded && !isDownloading && (
        <button
          type="button"
          className="btn btn-ghost btn-primary btn-xs"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <DownloadIcon />
          {isDownloading ? 'Downloading' : 'Download   '}
        </button>
      )}
      {isDownloading && (
        <button type="button" className="btn btn-ghost btn-error btn-xs" onClick={handleCancel}>
          <CrossCircledIcon />
          Cancel
        </button>
      )}
      {isDownloaded && !!onDelete && (
        <button type="button" className="btn btn-ghost btn-error btn-xs" onClick={handleDelete}>
          <CrossCircledIcon />
          Delete
        </button>
      )}
    </div>
  )
}
