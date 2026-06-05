import { CalendarIcon, TimerIcon } from '@radix-ui/react-icons'
import { useRecording } from '@weesper/hooks'
import { getRecordingAudio } from '@weesper/ipc'
import classNames from 'classnames'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { Modal, TextPreview } from '@/components'
import { formatDuration } from '@/utils/format'

export const RecordingModal = ({ recordingId, onClose }: { recordingId: string | null; onClose: () => void }) => {
  const { data: recording, isLoading } = useRecording(recordingId ?? undefined)
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null)

  // Fetch audio bytes over IPC and create a blob URL
  useEffect(() => {
    let url: string | null = null

    if (!recordingId) {
      setAudioBlobUrl(null)
      return
    }

    getRecordingAudio(window.ipcRenderer, recordingId).then((bytes) => {
      if (bytes) {
        // @ts-expect-error
        const blob = new Blob([bytes], { type: 'audio/wav' })
        url = URL.createObjectURL(blob)
        setAudioBlobUrl(url)
      }
    })

    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [recordingId])

  return (
    <Modal isOpen={!!recordingId} onClose={onClose} title="Recording Details" clickOutsideToClose>
      {isLoading && <div className="loading loading-spinner loading-md"></div>}

      {recording && (
        <div className="space-y-6 mt-4">
          <div className="flex gap-6 text-sm">
            <HeaderItem label="Created at" value={format(new Date(recording.createdAt), 'PPPP pp')} icon="calendar" />
            <HeaderItem label="Duration" value={formatDuration(recording.duration)} icon="timer" />
          </div>

          {audioBlobUrl && (
            <div>
              <span className="font-semibold text-base-content/70 block mb-2">Audio:</span>
              {/* biome-ignore lint/a11y/useMediaCaption: transcription is provided below */}
              <audio controls src={audioBlobUrl} className="w-full" aria-describedby="transcription-text" />
            </div>
          )}

          <TextPreview
            id="transcription-text"
            label="Transcription"
            text={recording.transcribedText}
            placeholder="No transcription available"
          />

          {recording.enhancedText && <TextPreview label="Enhanced Text" text={recording.enhancedText} />}
        </div>
      )}
    </Modal>
  )
}

type HeaderItemProps = {
  label: string
  value: string
  icon: 'calendar' | 'timer'
}

const HeaderItem = ({ label, value, icon }: HeaderItemProps) => {
  const mapIcon = {
    calendar: CalendarIcon,
    timer: TimerIcon,
  }
  const Icon = mapIcon[icon]
  return (
    <div className="flex items-center gap-2">
      <div className={classNames('tooltip tooltip-top', { 'tooltip-right': icon === 'calendar' })} data-tip={label}>
        <Icon className="w-5 h-5 text-base-content/70" />
      </div>
      <p>{value}</p>
    </div>
  )
}
