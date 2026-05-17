import classname from 'classnames'

type Props = {
  title: string
  description: string
  variant?: 'default' | 'small'
}

export const Header = ({ title, description, variant = 'default' }: Props) => {
  const Tag = variant === 'default' ? 'h1' : 'h2'

  return (
    <header className="gap-2">
      <Tag
        className={classname({
          'text-2xl font-black tracking-tight': variant === 'default',
          'text-xl font-bold tracking-tight': variant === 'small',
        })}
      >
        {title}
      </Tag>
      <p
        className={classname({
          'opacity-80 text-md': variant === 'default',
          'opacity-60 text-sm': variant === 'small',
        })}
      >
        {description}
      </p>
    </header>
  )
}
