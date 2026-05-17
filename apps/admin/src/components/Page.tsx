import { Header } from '@/components'

type Props = {
  title: string
  description: string
  children: React.ReactNode
}

export const Page = ({ title, description, children }: Props) => {
  return (
    <div className="flex flex-col gap-4">
      <Header title={title} description={description} />
      <div className="animate-page-in">{children}</div>
    </div>
  )
}
