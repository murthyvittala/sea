export const PAYPAL_PLANS = {
  basic: {
    id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_BASIC,
    name: 'Basic',
    price: 9.99,
  },
  pro: {
    id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO,
    name: 'Pro',
    price: 29.99,
  },
  advanced: {
    id: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_ADVANCED,
    name: 'Advanced',
    price: 49.99,
  },
}

export async function createPayPalSubscription(planId: string, userId: string) {
  try {
    const response = await fetch('/api/payment/paypal/create-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId, userId }),
    })

    if (!response.ok) {
      throw new Error('Failed to create subscription')
    }

    return await response.json()
  } catch (err) {
    console.error('Error creating subscription:', err)
    throw err
  }
}

export async function verifyPayPalSubscription(subscriptionId: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYPAL_API_TOKEN}`,
        },
      }
    )

    return await response.json()
  } catch (err) {
    console.error('Error verifying subscription:', err)
    throw err
  }
}