import { CheckIcon, CopyIcon } from '@radix-ui/react-icons'
import { copyText } from '@weesper/ipc'
import classNames from 'classnames'
import { useState } from 'react'

interface TextPreviewProps {
  id?: string
  label: string
  text: string | null
  placeholder?: string
}

export const TextPreview = ({ id, label, text, placeholder = 'No text available' }: TextPreviewProps) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!text) return
    await copyText(window.ipcRenderer, text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div id={id} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-base-content/70 text-sm">{label}</span>
      </div>
      <div className="relative group">
        {text && (
          <div
            className={classNames(
              'absolute top-2 right-2 z-10 tooltip tooltip-top before:text-[10px] before:font-bold opacity-0 group-hover:opacity-100 transition-all',
              {
                'tooltip-open tooltip-success opacity-100': copied,
              },
            )}
            data-tip={copied ? 'Copied!' : 'Copy'}
          >
            <button
              type="button"
              className="btn btn-ghost btn-xs btn-square bg-base-200/80 backdrop-blur-md border border-base-content/10 shadow-sm hover:text-primary transition-colors"
              onClick={handleCopy}
              aria-label="Copy to clipboard"
            >
              {copied ? <CheckIcon className="w-3.5 h-3.5 text-success" /> : <CopyIcon className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
        <div
          className={classNames(
            'bg-base-200 p-6 rounded-lg whitespace-pre-wrap min-h-24 max-h-48 overflow-y-auto text-sm border border-transparent group-hover:border-base-content/10 transition-colors',
            { 'italic text-base-content/40': !text },
          )}
        >
          {text || placeholder}
        </div>
      </div>
    </div>
  )
}
