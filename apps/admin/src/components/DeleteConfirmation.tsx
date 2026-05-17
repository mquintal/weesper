import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  title: string
  description: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export const DeleteConfirmation = ({ title, description, isOpen, onClose, onConfirm }: Props) => {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus()
    }
    return () => {
      cancelRef.current?.blur()
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <dialog id="my_modal_1" className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{description}</p>
        <div className="modal-action">
          <form className="flex justify-between w-full" method="dialog">
            <button type="button" ref={cancelRef} className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-error" onClick={onConfirm}>
              Delete
            </button>
          </form>
        </div>
      </div>
    </dialog>,
    document.body,
  )
}
