import { useMicSettings } from '@open-bisbis/hooks'
import classNames from 'classnames'
import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components'

export const MicPicker = () => {
  const { micInUse, setMicInUse, devices, isSelectedMicDisconnected } = useMicrophoneSettings()

  const handleMicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMicInUse(e.target.value)
  }

  return (
    <Card
      icon={<MicrophoneIcon />}
      title="Audio Input"
      description="Select the microphone you want to use for transcription."
    >
      <select
        className={classNames('select select-bordered w-full', {
          'border-warning/50 bg-warning/5': isSelectedMicDisconnected,
        })}
        value={micInUse || ''}
        onChange={handleMicChange}
      >
        <option value="">Default Microphone</option>
        {isSelectedMicDisconnected && (
          <option value={micInUse} disabled>
            Disconnected Device
          </option>
        )}
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Microphone (${device.deviceId.slice(0, 8)})`}
          </option>
        ))}
      </select>

      {isSelectedMicDisconnected && (
        <div role="alert" className="alert alert-warning alert-soft mt-2">
          <span>Selected microphone is disconnected and it will be falling back to the default microphone.</span>
        </div>
      )}

      <div className="mt-4 flex items-center gap-2">
        <div
          className={classNames('w-2 h-2 rounded-full', {
            'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]': devices.length > 0,
            'bg-yellow-500 animate-pulse': devices.length === 0,
          })}
        />
        <span className="text-[10px] opacity-40 font-bold tracking-widest uppercase">
          {devices.length === 0 ? 'Searching for devices...' : `${devices.length} Devices Available`}
        </span>
      </div>
    </Card>
  )
}

const MicrophoneIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6 text-primary"
  >
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const useMicrophoneSettings = () => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const { micInUse, setMicInUse } = useMicSettings()
  const isSelectedMicDisconnected = micInUse && devices.length > 0 && !devices.find((d) => d.deviceId === micInUse)

  const getDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const microphones = allDevices.filter((device) => device.kind === 'audioinput')
      setDevices(microphones)
    } catch (err) {
      console.error('Error fetching microphones:', err)
    }
  }, [])

  useEffect(() => {
    getDevices()

    // Listen for device changes (plugging/unplugging mics)
    navigator.mediaDevices.addEventListener('devicechange', getDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices)
    }
  }, [getDevices])

  return {
    setMicInUse: (deviceId: string) => setMicInUse(deviceId),
    devices,
    micInUse,
    isSelectedMicDisconnected,
    getDevices,
  }
}
