// Analytics tracking utilities

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: Date
}

class AnalyticsTracker {
  private events: AnalyticsEvent[] = []
  private enabled: boolean = true

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  track(event: AnalyticsEvent) {
    if (!this.enabled) return

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
    }

    this.events.push(enrichedEvent)
    this.sendEvent(enrichedEvent)
  }

  private async sendEvent(event: AnalyticsEvent) {
    // Send to analytics service (e.g., GA, Mixpanel, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, event.properties)
    }
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  clearEvents() {
    this.events = []
  }
}

export const analytics = new AnalyticsTracker()

// Common events
export const trackingEvents = {
  USER_SIGNUP: 'user_signup',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  SUBSCRIPTION_UPGRADE: 'subscription_upgrade',
  GA_CONNECTED: 'ga_connected',
  GSC_CONNECTED: 'gsc_connected',
  PAGESPEED_SCAN: 'pagespeed_scan',
  SETTINGS_UPDATED: 'settings_updated',
}

export function trackEvent(name: string, properties?: Record<string, any>) {
  analytics.track({ name, properties })
}