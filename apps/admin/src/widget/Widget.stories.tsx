import type { Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import { Widget } from './Widget'

const meta = {
  title: 'Widget/Widget',
  component: Widget,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const { status, isRecording, stream } = context.args

      useEffect(() => {
        if (status) {
          ;(window as any).ipcRenderer.send('widget/status', status)
        }
        window.dispatchEvent(
          new CustomEvent('mock-recording-manager', {
            detail: { isRecording: !!isRecording, stream: stream || null },
          }),
        )
      }, [status, isRecording, stream])

      return <Story />
    },
    (Story) => (
      <div className="w-[170px] h-[40px] overflow-hidden rounded-2xl shadow-lg">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<any>

export default meta
type Story = StoryObj<typeof meta>

export const Recording: Story = {
  args: {
    status: 'recording',
    isRecording: true,
    stream: null,
  },
}

export const Transcribing: Story = {
  args: {
    status: 'transcribing',
  },
}

export const Enhancing: Story = {
  args: {
    status: 'enhancing',
  },
}

export const Finished: Story = {
  args: {
    status: 'finished',
  },
}

export const ErrorStatus: Story = {
  args: {
    status: 'error',
  },
}
