import { ArrowRightIcon, ExclamationTriangleIcon, RocketIcon } from '@radix-ui/react-icons'
import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`
}

type Props =
  | {
      state: 'downloaded'
      version?: string
      progress?: never
      error?: never
      onInstall: () => void
    }
  | {
      state: 'downloading'
      version?: never
      progress: {
        percent: number
        transferred: number
        total: number
      }
      error?: never
      onInstall?: never
    }
  | {
      state: 'error'
      version?: never
      progress?: never
      error: string
      onInstall?: never
    }

export const UpdateBanner = ({ state, ...rest }: Props) => {
  return (
    <AnimatePresence>
      {(state === 'downloading' || state === 'downloaded' || state === 'error') && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden w-full"
        >
          <div
            className={classNames('border border-primary/20 bg-primary/10 rounded-xl p-2 text-sm', {
              'hover:bg-primary hover:text-white cursor-pointer text-primary transitions-all duration-200':
                state === 'downloaded',
            })}
          >
            {state === 'downloading' && (
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium flex items-center gap-1.5">Downloading Update</span>
                  <span className="opacity-70 font-mono">{rest.progress?.percent.toFixed(0)}%</span>
                </div>
                <progress
                  className="progress progress-primary w-full h-1.5"
                  value={rest.progress?.percent ?? 0}
                  max="100"
                ></progress>
                <div className="flex justify-between text-[10px] opacity-60 font-mono">
                  <span>
                    {formatBytes(rest.progress?.transferred ?? 0)} / {formatBytes(rest.progress?.total ?? 0)}
                  </span>
                </div>
              </div>
            )}

            {state === 'downloaded' && (
              <button type="button" className="flex gap-1 w-full cursor-pointer" onClick={rest.onInstall}>
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <RocketIcon className="w-4 text-inherit" />
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] text-inherit">Relaunch to Update</span>
                      {rest.version && <span className="text-[8px] text-inherit">{`v${rest.version}`}</span>}
                    </div>
                  </div>
                  <ArrowRightIcon className="w-4 text-inherit" />
                </div>
              </button>
            )}

            {state === 'error' && (
              <div className="flex flex-col gap-2 w-full text-error">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4" />
                  <span className="font-medium text-xs leading-tight line-clamp-2" title={rest.error}>
                    {rest.error}
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
