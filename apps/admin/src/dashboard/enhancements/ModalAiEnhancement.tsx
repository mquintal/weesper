import { InfoCircledIcon, MagicWandIcon } from '@radix-ui/react-icons'
import type { CreateShortcut, Shortcut } from '@weesper/ipc'
import classNames from 'classnames'
import { useEffect, useRef, useState } from 'react'
import { InputShortcut, Modal } from '@/components'

type Props = {
  isOpen: boolean
  initial?: Shortcut
  items: Shortcut[]
  onSave: (shortcut: CreateShortcut) => void
  onClose: () => void
}

export const ModalAiEnhancement = ({ isOpen, initial, items, onSave, onClose }: Props) => {
  const [name, setName] = useState(initial?.name ?? '')
  const [shortcut, setShortcut] = useState(initial?.shortcut ?? '')
  const [prompt, setPrompt] = useState(initial?.prompt ?? '')
  const cancelRef = useRef<HTMLButtonElement>(null)

  const isDuplicateName = items.some(
    (item) => item.name.toLowerCase() === name.trim().toLowerCase() && item.id !== initial?.id,
  )
  const isValid = name.trim().length > 0 && shortcut.trim().length > 0 && prompt.trim().length > 0 && !isDuplicateName

  useEffect(() => {
    if (isOpen) {
      setName(initial?.name ?? '')
      setShortcut(initial?.shortcut ?? '')
      setPrompt(initial?.prompt ?? '')
    }
  }, [isOpen, initial?.shortcut, initial?.prompt, initial?.name])

  // ESC key handling
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) cancelRef.current?.focus()
  }, [isOpen])

  const handleSave = () => {
    if (!isValid) return
    onSave({
      // id: initial?.id,
      name: name.trim(),
      shortcut: shortcut.trim(),
      prompt: prompt.trim(),
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <MagicWandIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-lg">{initial ? 'Edit' : 'Add'} AI Enhancement</h3>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <label className="label text-sm font-semibold">Name</label>
            <div className="tooltip tooltip-right">
              <span className="tooltip-content max-w-40 mr-2">Name to identify the AI Enhancement in the list.</span>
              <InfoCircledIcon className="text-gray-500" />
            </div>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Grammar Fix, Formal Tone…"
            className={classNames('input input-bordered w-full', {
              'input-error': isDuplicateName,
            })}
          />
          {isDuplicateName && (
            <p className="text-error text-xs mt-1">An AI Enhancement with this name already exists.</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <label className="label text-sm font-semibold">Trigger Shortcut</label>
            <div className="tooltip tooltip-top">
              <span className="tooltip-content max-w-50 mr-2">
                Press the key combination you want to use to trigger this AI Enhancement.
              </span>
              <InfoCircledIcon className="text-gray-500" />
            </div>
          </div>
          <InputShortcut value={shortcut} onChange={setShortcut} placeholder="Click to record trigger shortcut…" />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <label className="label text-sm font-semibold">Enhancement Prompt</label>
            <div className="tooltip tooltip-top">
              <span className="tooltip-content max-w-45 mr-2">Prompt used to enhance the transcribed text.</span>
              <InfoCircledIcon className="text-gray-500" />
            </div>
          </div>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Improve the grammar and tone of the transcribed text without changing its meaning."
            className="textarea textarea-bordered w-full resize-none"
          />
        </div>

        <div className="modal-action">
          <form className="flex justify-between w-full" method="dialog">
            <button type="button" ref={cancelRef} className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={!isValid}>
              {initial ? 'Save' : 'Create'}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  )
}
