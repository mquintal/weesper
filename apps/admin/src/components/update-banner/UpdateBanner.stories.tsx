import type { Meta, StoryObj } from '@storybook/react'
import { UpdateBanner } from './UpdateBanner'

const meta = {
  title: 'Components/UpdateBanner',
  component: UpdateBanner,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UpdateBanner>

export default meta
type Story = StoryObj<typeof meta>

export const Downloading: Story = {
  args: {
    state: 'downloading',
    progress: {
      percent: 50,
      transferred: 1000000,
      total: 2000000,
    },
  },
}

export const Downloaded: Story = {
  args: {
    state: 'downloaded',
    version: '0.0.1',
    onInstall: () => alert('Installing update...'),
  },
}

export const WithError: Story = {
  args: {
    state: 'error',
    error: 'Error downloading update',
  },
}
