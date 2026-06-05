import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { listenToWidgetStatus, listenToWidgetWillHide, type WidgetStatus } from '@weesper/ipc'
import { logger } from '@weesper/logger'
import classNames from 'classnames'
import { AnimatePresence, motion } from 'framer-motion'
import hark from 'hark'
import Lottie, { type LottieRefCurrentProps } from 'lottie-react'
import React, { useEffect, useMemo, useState } from 'react'
import { enhancingAnimation, finishedAnimation, micAnimation, transcribingAnimation } from './lottiefiles'
import { useRecordingManager } from './useRecordingManager'

const BG_COLOR: Record<WidgetStatus, string> = {
  recording: '#FF9800',
  transcribing: '#86841C',
  enhancing: '#9286C9',
  finished: '#edfff4',
  error: 'rgba(127, 29, 29, 0.9)',
}

const LABEL: Record<WidgetStatus, string> = {
  recording: 'Listening',
  transcribing: 'Transcribing',
  enhancing: 'Enhancing',
  finished: '',
  error: 'Error',
}

export const Widget = () => {
  const { isRecording, stream } = useRecordingManager()
  const { status } = useStatusManagement()

  const icon = useMemo(() => {
    switch (status) {
      case 'recording':
        return <RecordingAnimation isRecording={isRecording} stream={stream} />
      case 'transcribing':
        return <Lottie animationData={transcribingAnimation} loop className="h-8" />
      case 'enhancing':
        return <Lottie animationData={enhancingAnimation} loop className="h-8" />
      case 'finished':
        return <FinishedAnimation />
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
    }
  }, [isRecording, status, stream])

  const label = LABEL[status]

  return (
    <motion.div
      animate={{ backgroundColor: BG_COLOR[status] }}
      className="h-full w-full min-h-[40px] flex items-center px-1"
    >
      <div className="flex gap-2 items-center w-full">
        <div
          className={classNames(
            'rounded-xl backdrop-blur-sm h-8 w-8 flex justify-center items-center overflow-hidden',
            {
              'bg-white/70': status === 'enhancing' || status === 'error',
              'bg-white/80': status === 'transcribing',
              'bg-white/20': status === 'recording',
              'bg-transparent': status === 'finished',
            },
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex justify-center items-center w-full h-full"
            >
              {icon}
            </motion.div>
          </AnimatePresence>
        </div>
        {label && (
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={status}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="text-xs font-black tracking-[0.15em] text-white block truncate uppercase"
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const RecordingAnimation = React.memo(
  ({ stream, isRecording }: { stream: MediaStream | null; isRecording: boolean }) => {
    const ref = React.useRef<LottieRefCurrentProps | null>(null)

    useEffect(() => {
      ref.current?.goToAndStop(10, true)

      logger.info('[Widget Lottie] RecordingAnimation effect triggered', {
        hasStream: !!stream,
        isRecording,
        streamId: stream?.id || null,
      })

      if (!stream || !isRecording) return

      const speechEvents = hark(stream, { threshold: -65, interval: 25 })

      speechEvents.on('speaking', () => {
        logger.debug('[Widget Lottie] Speech detected (hark: speaking)')
        // Playing segment between frames 10 and 30
        ref.current?.playSegments([10, 30], true)
      })

      speechEvents.on('stopped_speaking', () => {
        logger.debug('[Widget Lottie] Speech ended (hark: stopped_speaking)')
        ref.current?.goToAndStop(10, true)
      })

      return () => {
        speechEvents.stop()
      }
    }, [stream, isRecording])

    return <Lottie lottieRef={ref} animationData={micAnimation} loop={true} className="h-8" />
  },
)

const FinishedAnimation = () => {
  const ref = React.useRef<LottieRefCurrentProps | null>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.setSpeed(2.5)
    }
  }, [])

  return <Lottie lottieRef={ref} animationData={finishedAnimation} loop={false} className="h-8" />
}

const useStatusManagement = () => {
  const [status, setStatus] = useState<WidgetStatus>('recording')

  useEffect(() => {
    const unsubscribeWidgetStatus = listenToWidgetStatus(window.ipcRenderer, (newStatus) => {
      setStatus(newStatus)
    })

    const unsubscribeWidgetWillHide = listenToWidgetWillHide(window.ipcRenderer, () => {
      setStatus('recording')
    })

    return () => {
      unsubscribeWidgetStatus()
      unsubscribeWidgetWillHide()
    }
  }, [])

  return { status }
}
