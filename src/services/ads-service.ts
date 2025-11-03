/* global OwAd */

export interface AdsServiceOptions {
  adContainer: string
  size?: { width: number; height: number }
  onAdReady?: () => void
  onComplete?: (owAd: any) => void
  onImpression?: (owAd: any) => void
  onError?: (owAd: any, error: any) => void
  onDisplayAdLoaded?: (owAd: any) => void
  onPlayerLoaded?: (owAd: any) => void
  onPlay?: (owAd: any) => void
  removeOnComplete?: boolean
  autoShowAd?: boolean
}

export class AdsService {
  private options: AdsServiceOptions
  private owAd: any = null

  constructor(options: AdsServiceOptions) {
    this.options = options

    // if SDK is already defined show the ad
    if (typeof (window as any).OwAd !== 'undefined') {
      this.onOwAdReady()
    } else {
      // if not defined, inject SDK and wait for onload
      this.injectSDK()
    }
  }

  private injectSDK() {
    const script = document.createElement('script')

    script.src = 'https://content.overwolf.com/libs/ads/latest/owads.min.js'
    script.async = true
    script.onload = this.onOwAdReady.bind(this)

    document.body.appendChild(script)
  }

  private onOwAdReady() {
    if (!(window as any).OwAd) {
      // This scenario might happen if the user is running behind an ISP/public
      // router that might have detected the library as an ad and redirected the
      // request to an error page.
      console.error('OwAd SDK failed to load')
      if (this.options.onError) {
        this.options.onError(null, new Error('OwAd SDK not available'))
      }
      return
    }

    // The creation of an OwAd object will automatically load an ad
    const adOptions: any = { debugTracking: true }

    if (this.options.size) {
      adOptions.size = this.options.size
    }

    const container = document.getElementById(this.options.adContainer)
    if (!container) {
      console.error('Ad container not found:', this.options.adContainer)
      return
    }

    this.owAd = new (window as any).OwAd(container, adOptions)

    this.bindEvents()

    if (this.options.onAdReady) {
      this.options.onAdReady()
    }
  }

  private bindEvents() {
    if (!this.owAd) return

    this.owAd.addEventListener('complete', () => {
      if (this.options.onComplete) {
        this.options.onComplete(this.owAd)
      }

      if (this.options.removeOnComplete) {
        this.owAd.removeAd()
      }
    })

    if (this.options.onDisplayAdLoaded) {
      this.owAd.addEventListener('display_ad_loaded', () => {
        if (this.options.onDisplayAdLoaded) {
          this.options.onDisplayAdLoaded(this.owAd)
        }
      })
    }

    if (this.options.onPlay) {
      this.owAd.addEventListener('play', () => {
        if (this.options.onPlay) {
          this.options.onPlay(this.owAd)
        }
      })
    }

    this.owAd.addEventListener('impression', () => {
      if (this.options.onImpression) {
        this.options.onImpression(this.owAd)
      }
    })

    this.owAd.addEventListener('error', (error: any) => {
      if (this.options.onError) {
        this.options.onError(this.owAd, error)
      }
    })

    if (this.options.onPlayerLoaded) {
      this.owAd.addEventListener('player_loaded', () => {
        if (this.options.onPlayerLoaded) {
          this.options.onPlayerLoaded(this.owAd)
        }
      })
    }
  }

  removeAd() {
    if (this.owAd) {
      this.owAd.removeAd()
    }
  }

  refreshAd() {
    if (this.owAd) {
      this.owAd.refreshAd()
    }
  }

  destroy() {
    if (this.owAd) {
      this.owAd.removeAd()
      this.owAd = null
    }
  }
}
