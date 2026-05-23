import { useInstallUpdate, useUpdateProgress, useUpdateStatus } from '@open-bisbis/hooks'
import { DownloadIcon, ExclamationTriangleIcon, ReloadIcon } from '@radix-ui/react-icons'
import { AnimatePresence, motion } from 'framer-motion'

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

export const UpdateBanner = () => {
  const status = useUpdateStatus()
  const progress = useUpdateProgress()
  const { mutate: installUpdate, isPending: isInstalling } = useInstallUpdate()

  return (
    <AnimatePresence>
      {(status.state === 'available' ||
        status.state === 'downloading' ||
        status.state === 'downloaded' ||
        status.state === 'error') && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 overflow-hidden"
        >
          <div className="alert shadow-lg border border-primary/20 bg-primary/10 rounded-xl p-3 text-sm flex flex-col gap-2 relative">
            {status.state === 'available' && (
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                <span className="flex-1 font-medium">Update v{status.version} found!</span>
                <span className="text-xs opacity-70">Starting...</span>
              </div>
            )}

            {status.state === 'downloading' && (
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5">
                    <DownloadIcon className="w-3.5 h-3.5 animate-bounce" />
                    Downloading Update
                  </span>
                  <span className="opacity-70 font-mono">{progress?.percent.toFixed(0)}%</span>
                </div>
                <progress
                  className="progress progress-primary w-full h-1.5"
                  value={progress?.percent ?? 0}
                  max="100"
                ></progress>
                <div className="flex justify-between text-[10px] opacity-60 font-mono">
                  <span>{formatBytes(progress?.bytesPerSecond ?? 0)}/s</span>
                  <span>
                    {formatBytes(progress?.transferred ?? 0)} / {formatBytes(progress?.total ?? 0)}
                  </span>
                </div>
              </div>
            )}

            {status.state === 'downloaded' && (
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
                  </span>
                  <span className="font-medium">Update Ready!</span>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary w-full shadow-md"
                  onClick={() => installUpdate()}
                  disabled={isInstalling}
                >
                  {isInstalling ? <ReloadIcon className="w-3.5 h-3.5 animate-spin" /> : 'Restart to Install'}
                </button>
              </div>
            )}

            {status.state === 'error' && (
              <div className="flex flex-col gap-2 w-full text-error">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  <span className="font-medium text-xs leading-tight line-clamp-2" title={status.error}>
                    {status.error}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
