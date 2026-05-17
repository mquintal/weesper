import { useLanguages, useOnboarding, useSelectModel } from '@open-bisbis/hooks'
import { logger } from '@open-bisbis/logger'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import classNames from 'classnames'
import { useState } from 'react'
import { useToast } from '@/components'
import logo from '../assets/logo.svg'
import { AccessibilityGrant } from './AccessibilityGrant'
import { MicGrant } from './MicGrant'
import { Models } from './Models'

export const Onboarding = () => {
  const { canContinue, doContinue } = useOnboarding()
  const { data: languages = [], isError: isLanguagesError } = useLanguages()
  const { mutate: selectModel } = useSelectModel()
  const { toast } = useToast()
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [selectedModelId, setSelectedModelId] = useState('')
  const isReady = canContinue && !!selectedModelId && !isLanguagesError

  const handleStart = () => {
    logger.info('User clicked Get Started', { selectedLanguage, selectedModelId })
    if (!selectedModelId) return
    selectModel(
      { id: selectedModelId, language: selectedLanguage },
      {
        onSuccess: () => {
          doContinue()
        },
        onError: () => toast('Failed to select model', 'error'),
      },
    )
  }

  return (
    <div className="hero py-4 min-h-screen bg-base-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-base-200 to-base-200">
      <div className="hero-content text-center px-4 w-full">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center transform hover:rotate-6 transition-transform duration-300 overflow-hidden">
                <img src={logo} className="w-full h-full object-cover" alt="Open Bisbis Logo" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold mb-3 text-base-content tracking-tight">Open Bisbis</h1>
            <p className="text-md text-base-content/70">
              Your local, privacy-first AI voice assistant. Let's get you set up.
            </p>
          </div>

          <div className="flex flex-col gap-6 mb-8 text-left">
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-base-content/70 px-1">Permissions</h2>
              <div className="flex flex-col gap-3">
                <MicGrant />
                <AccessibilityGrant />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-base-content/70 px-1">Settings</h2>

              <div className="flex flex-col gap-1 form-control w-full">
                <label className="label">
                  <span className="label-text font-medium text-base-content/70">Language You will be Speaking</span>
                </label>
                <select
                  className={classNames('select select-bordered w-full bg-base-100', {
                    'select-error': isLanguagesError,
                  })}
                  value={isLanguagesError ? 'error' : selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  {isLanguagesError && (
                    <option value="error" disabled>
                      Failed to load languages
                    </option>
                  )}
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.language.charAt(0).toUpperCase() + lang.language.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <Models selectedModelId={selectedModelId} onSelect={setSelectedModelId} />
            </div>
          </div>

          <div>
            <button
              type="button"
              className="btn btn-primary btn-block btn-lg shadow-xl shadow-primary/20"
              disabled={!isReady}
              onClick={handleStart}
            >
              Get Started
              <ArrowRightIcon className="w-6 h-6" />
            </button>
            {!canContinue && (
              <p className="text-sm text-base-content/50 mt-4 font-medium text-center">
                Please grant the required permissions to continue.
              </p>
            )}
            {canContinue && !selectedModelId && (
              <p className="text-sm text-base-content/50 mt-4 font-medium text-center">
                Please select a speech model to continue.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
