import { MagicWandIcon } from '@radix-ui/react-icons'
import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Settings',
    description: 'Configure your application preferences here.',
    children: <div>Some input fields would go here.</div>,
  },
}

export const WithIconAndFooter: Story = {
  args: {
    icon: <MagicWandIcon className="w-6 h-6" />,
    title: 'AI Enhancements',
    description: 'Automatically enhance your transcripts.',
    children: <div>Enable automatic grammar correction and formatting.</div>,
    footer: (
      <button type="button" className="btn btn-primary">
        Save Changes
      </button>
    ),
  },
}

export const Selected: Story = {
  args: {
    title: 'Selected Option',
    description: 'This card is currently selected.',
    isSelected: true,
    children: <div>Details about this option.</div>,
  },
}
