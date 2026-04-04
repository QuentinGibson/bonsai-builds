import { useMemo, useState } from 'react'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../convex/_generated/api'
import { classNames } from '../../utils'
import './Feedback.scss'

const client = new ConvexHttpClient(process.env.CONVEX_URL!)

function resolveUserId(): Promise<string> {
  return new Promise((resolve) => {
    overwolf.profile.getCurrentUser((result) => {
      resolve(result.success && result.userId ? result.userId : 'anon')
    })
  })
}

export type FeedbackProps = {
  className?: string
  onClose: () => void
}

export function Feedback({ className, onClose }: FeedbackProps) {
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isContactValid = useMemo(() => contact.length > 3, [contact])
  const isMessageValid = useMemo(() => message.length > 3 && message.length <= 450, [message])
  const isFeedbackValid = isContactValid && isMessageValid

  const submit = async () => {
    if (!isFeedbackValid || submitting) return
    setSubmitting(true)
    try {
      const userId = await resolveUserId()
      await client.mutation(api.feedback.submit, { userId, contact, message })
    } catch (e) {
      console.error('Failed to submit feedback:', e)
    }
    setSubmitting(false)
    onClose()
  }

  return (
    <div className={classNames('Feedback', className)}>
      <h3>Write Us a Feedback</h3>

      <div className="content">
        <input
          className={classNames('text', { invalid: !isContactValid })}
          type="text"
          placeholder="Email/Discord"
          value={contact}
          onChange={e => setContact(e.target.value)}
        />
        <textarea
          className={classNames('text text-area', { invalid: !isMessageValid })}
          placeholder='I would like to let you know that…'
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <div className="message-length">{message.length}/450</div>
      </div>

      <div className="actions">
        <button className="action close" onClick={onClose}>Cancel</button>
        <button
          className="action submit"
          onClick={submit}
          disabled={!isFeedbackValid || submitting}
        >{submitting ? 'Sending…' : 'Send'}</button>
      </div>
    </div>
  )
}
