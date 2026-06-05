import { ChatBubbleIcon, CheckCircledIcon } from '@radix-ui/react-icons'
import * as Sentry from '@sentry/react'
import { logger } from '@weesper/logger'
import { useState } from 'react'
import { Modal } from '@/components'

export const Feedback = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const openFeedback = () => {
    setIsOpen(true)
    logger.info('Feedback modal opened')
  }

  const handleClose = () => {
    if (!isSuccess) {
      setName('')
      setEmail('')
      setMessage('')
    }
    setIsOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      Sentry.captureFeedback({
        name,
        email,
        message,
        source: 'custom-feedback-modal',
        associatedEventId: Sentry.lastEventId(),
      })
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        handleClose()
      }, 2000)
      logger.info('Feedback submitted successfully')
    } catch (error) {
      logger.error('Failed to submit feedback:', { error: String(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" onClick={openFeedback} className="btn btn-ghost btn-xs flex gap-2">
        <ChatBubbleIcon className="text-inherit h-4 w-4 text-base-content/60" />
        Feedback
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Give us Feedback" clickOutsideToClose>
        {isSuccess ? (
          <div className="py-8 text-center text-success flex flex-col items-center gap-4">
            <CheckCircledIcon className="w-12 h-12" />
            <p className="font-medium">Thank you for your feedback!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <div className="form-control flex flex-col gap-1">
              <label className="label">
                <span className="label-text font-medium">
                  Name <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-control flex flex-col gap-1">
              <label className="label">
                <span className="label-text font-medium">
                  Email <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="email"
                className="input input-bordered w-full"
                placeholder="your.email@example.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control flex flex-col gap-1">
              <label className="label">
                <span className="label-text font-medium">
                  Description <span className="text-error">*</span>
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered h-32 w-full"
                placeholder="What's the bug? What did you expect? What do you want us to improve?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="flex justify-between gap-2 mt-4">
              <button type="button" className="btn btn-ghost" onClick={handleClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-soft" disabled={isSubmitting}>
                {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
