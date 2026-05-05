import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { verifyPaystackPayment, fromPaystackAmount } from '@/lib/paystack'

export async function POST(req: NextRequest) {
  try {
    const { reference, type, amount, currency } = await req.json()

    if (!reference) {
      return NextResponse.json({ success: false, error: 'Reference required' }, { status: 400 })
    }

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')
    const supabaseServer = createServerSupabaseClient() as any

    // Use the typed client from lib/supabase
    const { data: { user } } = await supabaseServer.auth.getUser(req.cookies.get('sb-access-token')?.value || '')
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check for duplicate reference
    const { data: existing } = await supabaseServer
      .from('transactions')
      .select('id')
      .eq('reference', reference)
      .single()

    if (existing) {
      return NextResponse.json({ success: false, error: 'Transaction already processed' }, { status: 400 })
    }

    // Verify with Paystack
    const verification = await verifyPaystackPayment(reference)
    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 400 })
    }

    const paystackData = verification.data as Record<string, unknown>
    const verifiedAmount = fromPaystackAmount(paystackData.amount as number)
    const verifiedCurrency = (paystackData.currency as 'KES' | 'USD') || (currency as 'KES' | 'USD')

    // Record transaction
    await supabaseServer.from('transactions').insert({
      user_id: user.id,
      type: 'deposit',
      amount: verifiedAmount,
      currency: verifiedCurrency,
      status: 'completed',
      reference: reference as string,
      description: 'Wallet top-up via Paystack',
      paystack_data: paystackData,
    } as any)

    // Credit wallet
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    const newBalance = (profile?.wallet_balance || 0) + verifiedAmount
    await supabaseServer
      .from('profiles')
      .update({ wallet_balance: newBalance } as any)
      .eq('id', user.id)

    // Create notification
    await supabaseServer.from('notifications').insert({
      user_id: user.id,
      type: 'payment_received',
      title: 'Wallet Funded',
      body: `${verifiedCurrency} ${verifiedAmount.toLocaleString()} has been added to your wallet.`,
      data: { reference, amount: verifiedAmount },
    } as any)

    return NextResponse.json({
      success: true,
      amount: verifiedAmount,
      currency: verifiedCurrency,
      new_balance: newBalance,
    })
  } catch (err) {
    console.error('Payment verification error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
