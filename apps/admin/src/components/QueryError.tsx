type Props = {
  message?: string
  onRetry?: () => void
}

export const QueryError = ({ message = 'Failed to load data', onRetry }: Props) => {
  return (
    <div role="alert" className="alert alert-error alert-outline">
      <div className="flex items-center gap-2 flex-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-error" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}
