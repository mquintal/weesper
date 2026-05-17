import { Cross1Icon, LightningBoltIcon, MagicWandIcon } from '@radix-ui/react-icons'
import classNames from 'classnames'
import { useLocalStorage } from 'react-use'

type Props = {
  hasShortcuts: boolean
  hasLlm: boolean
}
export const Onboarding = ({ hasShortcuts, hasLlm }: Props) => {
  const [dismissed, setDismissed] = useLocalStorage('ai-enhancements-onboarding-dismissed', false)

  if (dismissed) {
    return null
  }

  return (
    <div className="flex items-start justify-between w-full">
      <ul className="steps steps-vertical">
        <li className={classNames('step', { 'step-accent': hasShortcuts, 'text-gray-400': !hasShortcuts })}>
          <span className="step-icon">
            <MagicWandIcon
              className={classNames('w-4 h-4', {
                'text-gray-400': !hasShortcuts,
                'text-white': hasShortcuts,
              })}
            />
          </span>
          Define an AI Enhancement
        </li>
        <li className={classNames('step', { 'step-accent': hasLlm, 'text-gray-400': !hasLlm })}>
          <span className="step-icon">
            <LightningBoltIcon
              className={classNames('w-4 h-4', {
                'text-gray-400': !hasLlm,
                'text-white': hasLlm,
              })}
            />
          </span>
          Select an AI Model
        </li>
      </ul>
      <button
        type="button"
        className="btn btn-sm btn-ghost tooltip tooltip-top"
        data-tip="Dismiss"
        onClick={() => setDismissed(true)}
      >
        <Cross1Icon className="w-4 h-4" />
      </button>
    </div>
  )
}
