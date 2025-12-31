// lib/plans.ts

export type PlanType = 'free' | 'starter' | 'pro' | 'advanced' | 'enterprise' 
export interface PlanLimits {
  websites: number
  metaTitles: number
  segments: number
  trafficWeeks: number
  aiAgents: number
}

export interface PlanConfig {
  name: string
  price: number
  priceDisplay: string
  description: string
  paypalPlanId: string | null
  features: string[]
  limits: PlanLimits
  popular?: boolean
  isEnterprise?: boolean
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Free',
    price: 0,
    priceDisplay: '$0',
    description: 'Perfect for trying out the platform',
    paypalPlanId: null,
    features: [
      '1 website in settings',
      '30 meta titles crawled',
      'Create 3 segments',
      '2 weeks of traffic analytics and keywords',
      'Access 1 AI agent',
      '1 Daily AI Assist/Chat',
    ],
    limits: {
      websites: 1,
      metaTitles: 30,
      segments: 3,
      trafficWeeks: 2,
      aiAgents: 1,
    },
  },
  starter: {
    name: 'Starter',
    price: 9.95,
    priceDisplay: '$9.95',
    description: 'Great for bloggers and small websites',
    paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_STARTER || '',
    features: [
      '1 website in settings',
      '100 meta titles crawled',
      'Create 10 segments',
      '1 month of traffic analytics and keywords',
      'Access 3 AI agents',
      '5 Daily AI Assist/Chat',
    ],
    limits: {
      websites: 1,
      metaTitles: 100,
      segments: 10,
      trafficWeeks: 4,
      aiAgents: 3,
    },
  },
  pro: {
    name: 'Pro',
    price: 24.95,
    priceDisplay: '$24.95',
    description: 'For growing businesses and professionals',
    paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO || '',
    popular: true,
    features: [
      '5 websites in settings',
      '500 meta titles crawled',
      'Create 20 segments',
      '2 months of traffic analytics and keywords',
      'Access 5 AI agents',
      '10 Daily AI Assist/Chat',
    ],
    limits: {
      websites: 5,
      metaTitles: 500,
      segments: 20,
      trafficWeeks: 8,
      aiAgents: 5,
    },
  },
  advanced: {
    name: 'Advanced',
    price: 99.95,
    priceDisplay: '$99.95',
    description: 'For agencies managing multiple clients',
    paypalPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_ADVANCED || '',
    features: [
      '10 websites in settings',
      '1000 meta titles crawled',
      'Create 40 segments',
      '3 months of traffic analytics and keywords',
      'Access all AI agents',
      '30 Daily AI Assist/Chat',
    ],
    limits: {
      websites: 10,
      metaTitles: 1000,
      segments: 40,
      trafficWeeks: 12,
      aiAgents: 999,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 0,
    priceDisplay: 'Custom',
    description: 'Custom solutions for large organizations',
    paypalPlanId: null,
    features: [
      'Unlimited websites',
      'Unlimited meta titles crawled',
      'Unlimited segments',
      'Unlimited traffic analytics and keywords',
      'Unlimited AI agents',
      'Dedicated support',
    ],
    limits: {
      websites: 99999,
      metaTitles: 999999,
      segments: 99999,
      trafficWeeks: 9999,
      aiAgents: 99999,
    },
    isEnterprise: true,
  }
}

// Helper functions
export function getPlan(planType: PlanType): PlanConfig {
  return PLANS[planType] || PLANS.free
}

export function canUpgrade(currentPlan: PlanType, targetPlan: PlanType): boolean {
  const planOrder: PlanType[] = ['free', 'starter', 'pro', 'advanced']
  return planOrder.indexOf(targetPlan) > planOrder.indexOf(currentPlan)
}