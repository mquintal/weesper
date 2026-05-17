import classname from 'classnames'

type Props = {
  icon?: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  isSelected?: boolean
  extras?: React.ReactNode
  onSelect?: () => void
}

export const Card = ({ icon, title, description, children, onSelect, isSelected, footer, extras }: Props) => {
  const isSelectable = !!onSelect && !isSelected

  return (
    <div
      {...(onSelect ? { onClick: onSelect } : {})}
      className={classname({
        'card bg-base-100 border-2 transition-all duration-300 shadow-md focus:shadow-xl': true,
        'hover:shadow-xl cursor-pointer': isSelectable,
        'border-primary bg-primary/5': isSelected,
        'border-transparent': !isSelected,
      })}
    >
      <div className={classname('card-body p-5 gap-4', { 'pb-2': !!footer })}>
        <div className="flex items-start gap-6">
          {icon && <div className="p-4 rounded-2xl bg-primary/10 text-primary shrink-0">{icon}</div>}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold mb-1">{title}</h2>
              {extras ? extras : null}
            </div>
            {description && <p className="text-sm opacity-50 mb-6 font-medium">{description}</p>}
            <div className="form-control w-full mt-4">{children}</div>
          </div>
        </div>
        {footer && (
          <div className="flex flex-col w-full">
            <div className="divider m-0" />
            <div className="card-actions w-full">{footer}</div>
          </div>
        )}
      </div>
    </div>
  )
}
