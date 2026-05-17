import { useAppInfo } from '@open-bisbis/hooks'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { Page } from '@/components'

export const About = () => {
  const { data: info } = useAppInfo()

  return (
    <Page title="About" description="Information about Open Bisbis">
      <div className="">
        <p className="opacity-70 leading-relaxed text-lg">
          Open Bisbis is a local-first voice transcription tool powered by OpenAI's Whisper models. Everything runs on
          your machine, ensuring maximum privacy and speed.
        </p>
        <div className="card-actions justify-start mt-4">
          <span className="badge badge-outline badge-md py-2 opacity-50">v{info?.version ?? '...'}</span>
          <span className="badge badge-outline badge-md py-2 opacity-50">
            <GitHubLogoIcon className="w-4 h-4 mr-1" />
            Open Source
          </span>
        </div>
      </div>
    </Page>
  )
}
