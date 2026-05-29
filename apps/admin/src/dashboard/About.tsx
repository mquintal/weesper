import { useAppInfo, useCheckForUpdate } from '@open-bisbis/hooks'
import { GitHubLogoIcon, ReloadIcon, RocketIcon } from '@radix-ui/react-icons'
import { Page, useToast } from '@/components'

export const About = () => {
  const { data: info } = useAppInfo()
  const { isUpdateAvailable, isChecking } = useCheckForUpdate()
  const { toast } = useToast()

  const handleCheckForUpdate = () => {
    isUpdateAvailable().then((isUpdateAvailable) => {
      if (!isUpdateAvailable) {
        toast('You are using the latest version!', 'success')
      }
    })
  }

  return (
    <Page title="About" description="Information about Open Bisbis">
      <div className="">
        <p className="opacity-70 leading-relaxed text-lg">
          Open Bisbis is a local-first voice transcription tool powered by OpenAI's Whisper models. Everything runs on
          your machine, ensuring maximum privacy and speed.
        </p>
        <div className="card-actions justify-start mt-4 items-center">
          <span className="badge badge-outline badge-md py-2 opacity-50">v{info?.version ?? '...'}</span>
          <span className="badge badge-outline badge-md py-2 opacity-50">
            <GitHubLogoIcon className="w-4 h-4 mr-1" />
            Open Source
          </span>
          <button
            type="button"
            className="btn btn-xs btn-outline opacity-50 ml-2"
            onClick={() => handleCheckForUpdate()}
            disabled={isChecking}
          >
            {isChecking ? <ReloadIcon className="w-3 h-3 animate-spin" /> : <RocketIcon className="w-3 h-3" />}
            Check for Updates
          </button>
        </div>
      </div>
    </Page>
  )
}
