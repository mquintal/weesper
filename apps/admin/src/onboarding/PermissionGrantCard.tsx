import classNames from 'classnames'

export type GrantStatus = 'granted' | 'denied' | 'prompt'

interface PermissionGrantCardProps {
  status: GrantStatus
  icon: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  infoMessage?: React.ReactNode
}

export const PermissionGrantCard = ({
  status,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  infoMessage,
}: PermissionGrantCardProps) => {
  const isSuccess = status === 'granted'
  const isError = status === 'denied'
  const isPrompt = status === 'prompt'

  return (
    <div
      className={classNames('card w-full shadow-sm border transition-colors duration-300', {
        'border-success/30 bg-success/5': isSuccess,
        'border-error/30 bg-error/5': isError,
        'border-base-300 bg-base-100': isPrompt,
      })}
    >
      <div className="card-body p-5 flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={classNames('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', {
              'bg-success/20 text-success': isSuccess,
              'bg-error/20 text-error': isError,
              'bg-warning/20 text-warning': isPrompt,
            })}
          >
            {icon}
          </div>
          <div className="text-left">
            <h3 className="font-bold text-base-content text-base">{title}</h3>
            <p className="text-xs text-base-content/70 mt-0.5">{description}</p>
          </div>
        </div>

        {!isSuccess && onAction && actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className={classNames('btn btn-sm', {
              'btn-error btn-outline': isError,
              'btn-primary': !isError,
            })}
          >
            {actionLabel}
          </button>
        )}
        {isSuccess && (
          <div className="text-success flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
      {infoMessage && (
        <div
          className={classNames('px-5 pb-5 pt-0 text-xs text-left leading-relaxed', {
            'text-error/80': isError,
            'text-warning/80': isPrompt,
          })}
        >
          {infoMessage}
        </div>
      )}
    </div>
  )
}
