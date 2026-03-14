import { api } from './axios'

export interface Plan {
  id: string
  code: 'BASIC' | 'STANDARD' | 'INSTITUTE'
  name: string
  planType: 'B2C' | 'B2B'
  priceFlat: number          // paise
  priceFormatted: string     // "₹149/month"
  maxDevices: number         // -1 = unlimited
  maxDevicesLabel: string
  features: string[]
  current: boolean
}

export interface Subscription {
  planCode: string
  planName: string
  planType: 'B2C' | 'B2B'
  status: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'
  isTrial: boolean
  trialEndsAt?: string
  periodEnd?: string
  deviceCount: number
  maxDevices: number
  maxDevicesLabel: string
  deviceUsagePercent: number
  daysRemaining: number
  nearLimit: boolean
  atLimit: boolean
  features: string[]
  monthlyTotal: number
  monthlyTotalFormatted: string
}

export interface CreateOrderResponse {
  orderId: string
  amount: number
  currency: string
  keyId: string
  planName: string
  planCode: string
  description: string
}

export const subscriptionApi = {
  getCurrent: () =>
    api.get<Subscription>('/subscription/current').then(r => r.data),

  getPlans: (type: 'B2C' | 'B2B' = 'B2C') =>
    api.get<Plan[]>(`/subscription/plans?type=${type}`).then(r => r.data),

  createOrder: (planCode: string) =>
    api.post<CreateOrderResponse>('/subscription/create-order', { planCode }).then(r => r.data),

  verifyPayment: (data: {
    razorpayOrderId: string
    razorpayPaymentId: string
    razorpaySignature: string
    planCode: string
  }) => api.post<Subscription>('/subscription/verify-payment', data).then(r => r.data),
}
