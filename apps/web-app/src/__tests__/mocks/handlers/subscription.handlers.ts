import { rest } from 'msw'
import { mockSubscription, mockPlans } from '../fixtures'

const BASE = 'http://localhost:8080/api/v1'

export const subscriptionHandlers = [
  rest.get(`${BASE}/subscription/current`, (req, res, ctx) => {
    return res(ctx.json(mockSubscription))
  }),

  rest.get(`${BASE}/subscription/plans`, (req, res, ctx) => {
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'B2C'
    return res(ctx.json(mockPlans.filter(p => p.planType === type)))
  }),

  rest.post(`${BASE}/subscription/create-order`, (req, res, ctx) => {
    return res(ctx.json({
      orderId: 'order_test_123',
      amount: 29900,
      currency: 'INR',
      keyId: 'rzp_test_xxx',
      planName: 'Standard',
      planCode: 'STANDARD',
      description: 'Kavach AI — Standard Plan (₹299/month)',
    }))
  }),

  rest.post(`${BASE}/subscription/verify-payment`, (req, res, ctx) => {
    return res(ctx.json({ ...mockSubscription, status: 'ACTIVE', isTrial: false }))
  }),

  rest.get(`${BASE}/subscription/can-add-device`, (req, res, ctx) => {
    return res(ctx.json({ canAdd: true }))
  }),
]
