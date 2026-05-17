import { useState } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const InputShortcut = ({ value, onChange, placeholder = 'Click to record shortcut...' }: Props) => {
  const [isRecording, setIsRecording] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsRecording(false)
      ;(e.target as HTMLElement).blur()
      return
    }

    e.preventDefault()
    e.stopPropagation()

    const modifiers: string[] = []
    if (e.metaKey) modifiers.push('⌘')
    if (e.altKey) modifiers.push('⌥')
    if (e.ctrlKey) modifiers.push('⌃')
    if (e.shiftKey) modifiers.push('⇧')

    const code = e.code
    if (
      [
        'ControlLeft',
        'ControlRight',
        'AltLeft',
        'AltRight',
        'ShiftLeft',
        'ShiftRight',
        'MetaLeft',
        'MetaRight',
      ].includes(code)
    )
      return

    let displayKey = code
      .replace('Key', '')
      .replace('Digit', '')
      .replace('ArrowUp', '↑')
      .replace('ArrowDown', '↓')
      .replace('ArrowLeft', '←')
      .replace('ArrowRight', '→')
      .toUpperCase()

    if (displayKey === 'SPACE') displayKey = 'SPACE'
    if (displayKey === 'ESCAPE') displayKey = 'ESC'

    const newShortcut = [...modifiers, displayKey].join(' + ')
    onChange(newShortcut)
    setIsRecording(false)
    ;(e.target as HTMLElement).blur()
  }

  const keys = value ? value.split(' + ') : []

  return (
    <button
      type="button"
      onFocus={() => setIsRecording(true)}
      onBlur={() => setIsRecording(false)}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-2 px-4 h-12 rounded-lg border cursor-pointer transition-all duration-300 focus:outline-none w-full
        ${
          isRecording
            ? 'border-primary/40 bg-base-300 shadow-inner'
            : 'border-white/10 bg-base-200/50 hover:bg-base-200 hover:border-white/20'
        }`}
    >
      {isRecording ? (
        <span className="text-sm text-base-content/50 italic">Press your desired keys…</span>
      ) : keys.length > 0 ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5">
            {keys.map((key, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <kbd className="kbd kbd-md">{key}</kbd>
                {i < keys.length - 1 && <span className="text-base-content/40 text-xs">+</span>}
              </span>
            ))}
          </div>
          <span className="text-xs text-base-content/40">Click to change</span>
        </div>
      ) : (
        <span className="text-sm text-base-content/50 italic">{placeholder}</span>
      )}
    </button>
  )
}
