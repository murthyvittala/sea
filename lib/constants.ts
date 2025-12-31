// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
  ADVANCED: 'advanced',
}

export const PLAN_LIMITS = {
  free: {
    websiteLimit: 1,
    keywordLimit: 100,
    pageSpeedLimit: 50,
  },
  basic: {
    websiteLimit: 3,
    keywordLimit: 500,
    pageSpeedLimit: 999999,
  },
  pro: {
    websiteLimit: 10,
    keywordLimit: 2000,
    pageSpeedLimit: 999999,
  },
  advanced: {
    websiteLimit: 999,
    keywordLimit: 999999,
    pageSpeedLimit: 999999,
  },
}

// API Endpoints
export const API_ENDPOINTS = {
  GA: {
    AUTHORIZE: '/api/ga/authorize',
    CALLBACK: '/api/ga/callback',
    DATA: '/api/data/ga',
  },
  GSC: {
    AUTHORIZE: '/api/gsc/authorize',
    CALLBACK: '/api/gsc/callback',
    DATA: '/api/data/gsc',
  },
  PAGESPEED: {
    DATA: '/api/data/pagespeed',
  },
  PAYMENT: {
    CREATE_SUBSCRIPTION: '/api/payment/paypal/create-subscription',
    WEBHOOK: '/api/payment/paypal/webhook',
  },
}

// GA4 Fields
export const GA4_FIELDS = {
  SESSIONS: 'sessions',
  USERS: 'users',
  PAGEVIEWS: 'pageviews',
  BOUNCE_RATE: 'bounceRate',
  AVERAGE_SESSION_DURATION: 'averageSessionDuration',
  CONVERSIONS: 'conversions',
  CONVERSION_RATE: 'conversionRate',
  EVENTS: 'events',
  TRAFFIC_SOURCES: 'trafficSources',
  DEVICES: 'devices',
  GEO: 'geo',
}

// GSC Fields
export const GSC_FIELDS = {
  CLICKS: 'clicks',
  IMPRESSIONS: 'impressions',
  CTR: 'ctr',
  POSITION: 'position',
  QUERIES: 'queries',
  PAGES: 'pages',
  COUNTRIES: 'countries',
  DEVICES: 'devices',
}

// PageSpeed Metrics
export const PAGESPEED_METRICS = {
  PERFORMANCE: 'performance',
  ACCESSIBILITY: 'accessibility',
  SEO: 'seo',
  BEST_PRACTICES: 'best_practices',
}

export const METRIC_THRESHOLDS = {
  GOOD: 90,
  AVERAGE: 50,
  POOR: 0,
}