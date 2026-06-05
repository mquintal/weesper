import { KeyboardIcon } from '@radix-ui/react-icons'
import { useDefaultShortcut, useSetDefaultShortcut } from '@weesper/hooks'
import { Card, InputShortcut, QueryError, useToast } from '@/components'

export const Shortcuts = () => {
  const { data: shortcut = '...', isError, refetch } = useDefaultShortcut()
  const setDefaultShortcut = useSetDefaultShortcut()
  const { toast } = useToast()

  const handleStartStopChange = (newShortcut: string) => {
    setDefaultShortcut.mutate(newShortcut, {
      onError: () => toast('Failed to update shortcut', 'error'),
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
    </Card>
  )
}
