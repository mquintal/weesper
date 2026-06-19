import { KeyboardIcon } from '@radix-ui/react-icons'
import { useDefaultShortcut, useSetDefaultShortcut, useSetShortcutMode, useShortcutMode } from '@weesper/hooks'
import { Card, InputShortcut, QueryError, useToast } from '@/components'

export const Shortcuts = () => {
  const { data: shortcut = '...', isError, refetch } = useDefaultShortcut()
  const setDefaultShortcut = useSetDefaultShortcut()
  const { data: mode = 'toggle', isLoading: modeLoading } = useShortcutMode()
  const setShortcutMode = useSetShortcutMode()
  const { toast } = useToast()

  const handleStartStopChange = (newShortcut: string) => {
    setDefaultShortcut.mutate(newShortcut, {
      onError: () => toast('Failed to update shortcut', 'error'),
    })
  }

  const handleModeChange = () => {
    const newMode = mode === 'toggle' ? 'hold' : 'toggle'
    setShortcutMode.mutate(newMode, {
      onError: () => toast('Failed to update shortcut mode', 'error'),
      onSuccess: () => toast(`Switched to ${newMode === 'toggle' ? 'toggle' : 'press-and-hold'} mode`, 'success'),
    })
  }

  return (
    <Card
      icon={<KeyboardIcon className="w-6 h-6" />}
      title="Keyboard Shortcuts"
      description="Define a shortcut to start and stop your recording sessions."
    >
      {isError && <QueryError message="Failed to load shortcut" onRetry={refetch} />}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold text-base-content/70 tracking-widest mb-2">Default Shortcut</p>
        <InputShortcut value={shortcut} onChange={handleStartStopChange} placeholder="Click to record shortcut…" />
      </div>
      <div className="divider my-4" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-base-content/80">Push to Talk</span>
          <span className="text-xs text-base-content/50">
            {mode === 'hold'
              ? 'Hold the shortcut to record, release to stop'
              : 'Press once to start, press again to stop'}
          </span>
        </div>
        <input
          type="checkbox"
          className="toggle toggle-primary"
          checked={mode === 'hold'}
          onChange={handleModeChange}
          disabled={modeLoading || setShortcutMode.isPending}
        />
      </div>
    </Card>
  )
}
