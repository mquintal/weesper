import { MagicWandIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import type { Shortcut } from '@weesper/ipc'

type ListAiEnhancementsProps = {
  items: Shortcut[]
  isLoading?: boolean
  onEdit: (item: Shortcut) => void
  onDelete: (id: string) => void
}

export const ListAiEnhancements = ({ items, isLoading, onEdit, onDelete }: ListAiEnhancementsProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-md opacity-20"></span>
      </div>
    )
  }

  return (
    <List>
      {items.length > 0 &&
        items.map((item) => (
          <RowAiEnhancement key={item.id} item={item} onEdit={() => onEdit(item)} onDelete={() => onDelete(item.id)} />
        ))}
    </List>
  )
}

type RowAiEnhancementProps = {
  item: Shortcut
  onEdit: () => void
  onDelete: () => void
}

const RowAiEnhancement = ({ item, onEdit, onDelete }: RowAiEnhancementProps) => {
  const keys = item.shortcut.split(' + ')

  return (
    <li className="list-row hover:bg-base-200">
      <div className="flex items-center justify-center">
        <MagicWandIcon className="w-5 h-5 text-purple-400" />
      </div>
      <div className="flex flex-col gap-1">
        <div>{item.name}</div>
        <div className="text-xs uppercase font-semibold opacity-60 flex gap-1">
          {keys.map((key, i) => (
            <span key={i} className="flex items-center gap-1">
              <kbd className="kbd kbd-sm">{key}</kbd>
              {i < keys.length - 1 && <span className="text-base-content/40 text-xs">+</span>}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square"
          onClick={onEdit}
          aria-label="Edit AI Enhancement"
        >
          <Pencil1Icon className="w-4 h-4" />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square hover:text-error"
          onClick={onDelete}
          aria-label="Delete AI Enhancement"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </li>
  )
}

const List = ({ children }: { children: React.ReactNode }) => {
  return <ul className="list bg-base-100 rounded-box shadow-md">{children}</ul>
}
