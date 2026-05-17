import { Page } from '@/components'
import { MicPicker } from './MicPicker'
import { Shortcuts } from './shortcuts'

export const General = () => {
  return (
    <Page title="General" description="Configure your application settings">
      <div className="flex flex-col gap-8">
        <MicPicker />
        <Shortcuts />
      </div>
    </Page>
  )
}
