export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!

export interface PaystackConfig {
  email: string
  amount: number // in kobo (KES) or cents (USD) - Paystack uses smallest currency unit
  currency: 'KES' | 'USD' | 'NGN' | 'GHS'
  reference: string
  metadata?: Record<string, unknown>
  onSuccess: (reference: string) => void
  onClose: () => void
}

// Generate unique payment reference
export function generateReference(prefix = 'TC'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11).toUpperCase()}`
}

// Convert amount to Paystack's smallest unit
export function toPaystackAmount(amount: number, currency: string): number {
  // KES and USD both use 100 subunits (cents/cents)
  return Math.round(amount * 100)
}

// Convert from Paystack's smallest unit back to display amount
export function fromPaystackAmount(amount: number): number {
  return amount / 100
}

// Verify payment on server side
export async function verifyPaystackPayment(reference: string): Promise<{
  success: boolean
  data?: Record<string, unknown>
  error?: string
}> {
  try {
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )
    const data = await response.json()

    if (data.status && data.data.status === 'success') {
      return { success: true, data: data.data }
    }
    return { success: false, error: data.message }
  } catch (error) {
    return { success: false, error: 'Payment verification failed' }
  }
}

// Initialize Paystack inline (client-side)
export function initializePaystack(config: PaystackConfig) {
  if (typeof window === 'undefined') return

  const handler = (window as unknown as { PaystackPop: { setup: (config: Record<string, unknown>) => { openIframe: () => void } } }).PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: toPaystackAmount(config.amount, config.currency),
    currency: config.currency,
    ref: config.reference,
    metadata: config.metadata,
    callback: (response: { reference: string }) => {
      config.onSuccess(response.reference)
    },
    onClose: config.onClose,
  })

  handler.openIframe()
}

// Currency formatting
export function formatCurrency(amount: number, currency: 'KES' | 'USD' = 'KES'): string {
  return new Intl.NumberFormat(currency === 'KES' ? 'en-KE' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// KES <-> USD conversion (approximate - in production use a live rate API)
const KES_TO_USD_RATE = 0.0077 // 1 KES ≈ 0.0077 USD (adjust as needed)

export function kesToUsd(kes: number): number {
  return kes * KES_TO_USD_RATE
}

export function usdToKes(usd: number): number {
  return usd / KES_TO_USD_RATE
}

// Platform fee calculation (5% of task budget)
export const PLATFORM_FEE_PERCENT = 5

export function calculateFee(amount: number): number {
  return amount * (PLATFORM_FEE_PERCENT / 100)
}

export function calculatePayout(amount: number): number {
  return amount - calculateFee(amount)
}
