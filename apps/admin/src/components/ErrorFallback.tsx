export const ErrorFallback = () => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-base-100 text-base-content">
      <div className="card w-96 bg-base-200 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-error">Oops! Something went wrong.</h2>
          <p className="text-sm opacity-70 mt-2 mb-4">
            An unexpected error occurred in the application. An error report has been sent to our team.
          </p>
          <div className="card-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload Application
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
