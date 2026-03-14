'use client'

// Loads Razorpay checkout.js script once and exposes openCheckout()
// Usage: const { openCheckout } = useRazorpay()

import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    Razorpay: any
  }
}

export function useRazorpay() {
  const scriptLoaded = useRef(false)

  useEffect(() => {
    if (scriptLoaded.current || document.getElementById('razorpay-script')) return
    const script = document.createElement('script')
    script.id = 'razorpay-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => { scriptLoaded.current = true }
    document.body.appendChild(script)
  }, [])

  const openCheckout = useCallback((options: {
    orderId: string
    amount: number
    currency: string
    keyId: string
    name: string
    description: string
    userEmail?: string
    userPhone?: string
    onSuccess: (data: {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }) => void
    onDismiss?: () => void
  }) => {
    if (!window.Razorpay) {
      alert('Payment SDK not loaded. Please refresh and try again.')
      return
    }

    const rzp = new window.Razorpay({
      key: options.keyId,
      amount: options.amount,
      currency: options.currency,
      order_id: options.orderId,
      name: 'Kavach AI',
      description: options.description,
      image: '/logo.png',          // your logo path
      prefill: {
        email: options.userEmail || '',
        contact: options.userPhone || '',
      },
      theme: { color: '#3B82F6' },
      modal: {
        ondismiss: options.onDismiss || (() => {}),
      },
      handler: (response: any) => {
        options.onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
      },
    })
    rzp.open()
  }, [])

  return { openCheckout }
}
