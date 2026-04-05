import { useContext } from 'react'
import { AiOutlineCheckCircle, AiOutlineCrown } from 'react-icons/ai'
import { kSubscriptionUrl } from '../../config/constants'
import { CommonStoreContext } from '../../hooks/common-context'
import { useEventBus } from '../../hooks/use-event-bus'
import { classNames } from '../../utils'
import './Premium.scss'

export type PremiumProps = {
  className?: string
}

export function Premium({ className }: PremiumProps) {
  const { isPremium } = useContext(CommonStoreContext)
  const eventBus = useEventBus()

  const handleSubscribe = () => {
    if (kSubscriptionUrl) {
      eventBus.emit('openLink', kSubscriptionUrl)
    }
  }

  return (
    <div className={classNames('Premium', className)}>
      <div className="premium-content">
        <div className="premium-header">
          <AiOutlineCrown className="premium-crown" />
          <h2>Bonsai Builds Premium</h2>
          <p className="premium-subtitle">Support the app and build without distractions.</p>
        </div>

        {isPremium ? (
          <div className="plan-card plan-card--active">
            <div className="plan-badge">Subscribed</div>
            <h3>Ad-Free</h3>
            <ul className="plan-perks">
              <li><AiOutlineCheckCircle /> No ads, ever</li>
            </ul>
            <p className="plan-thankyou">Thank you for supporting Bonsai Builds.</p>
          </div>
        ) : (
          <div className="plan-card">
            <h3>Ad-Free</h3>
            <div className="plan-price">
              <span className="plan-price-amount">$3</span>
              <span className="plan-price-period">/ month</span>
            </div>
            <ul className="plan-perks">
              <li><AiOutlineCheckCircle /> No ads, ever</li>
            </ul>
            <button
              className="subscribe-btn"
              onClick={handleSubscribe}
              disabled={!kSubscriptionUrl}
            >
              {kSubscriptionUrl ? 'Subscribe via Overwolf' : 'Coming Soon'}
            </button>
            {!kSubscriptionUrl && (
              <p className="plan-note">Subscription will be available on the Overwolf store soon.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
