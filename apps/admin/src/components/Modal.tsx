import classNames from 'classnames'
import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  size?: 'regular' | 'large'
  clickOutsideToClose?: boolean
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'regular',
  clickOutsideToClose = false,
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (isOpen && dialog && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const handleClose = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }

  // Handle ESC key and backdrop clicks via the native onClose event of <dialog>
  const onDialogClose = (_e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    // If the dialog was closed by the browser (e.g. ESC key),
    // we should notify the parent after a small delay for animation.
    if (isOpen) {
      setTimeout(() => onClose(), 250)
    }
  }

  const onCancel = (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
    if (!clickOutsideToClose) {
      e.preventDefault()
    }
  }

  return createPortal(
    <dialog ref={dialogRef} className={classNames('modal')} onClose={onDialogClose} onCancel={onCancel}>
      <div
        className={classNames('modal-box relative', {
          'max-w-xl': size === 'regular',
          'max-w-3xl': size === 'large',
        })}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            {typeof title === 'string' ? <h3 className="font-bold text-lg">{title}</h3> : title}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
      {clickOutsideToClose && (
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={handleClose} disabled={!clickOutsideToClose}>
            close
          </button>
        </form>
      )}
    </dialog>,
    document.body,
  )
}
