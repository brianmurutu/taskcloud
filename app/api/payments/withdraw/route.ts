import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { generateReference } from '@/lib/paystack'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, phone } = await req.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    const supabaseServer = createServerSupabaseClient() as any

    // Auth
    const token = req.cookies.get('sb-access-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data: { user } } = await supabaseAuth.auth.getUser(token)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check balance
    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('wallet_balance, wallet_currency, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.wallet_balance < amount) {
      return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 400 })
    }

    const reference = generateReference('WDR')

    // Deduct from wallet
    await supabaseServer
      .from('profiles')
      .update({ wallet_balance: profile.wallet_balance - amount })
      .eq('id', user.id)

    // Record transaction
    await supabaseServer.from('transactions').insert({
      user_id: user.id,
      type: 'withdrawal',
      amount,
      currency: (currency as 'KES' | 'USD') || (profile.wallet_currency as 'KES' | 'USD'),
      status: 'pending',
      reference: reference as string,
      description: `Withdrawal to M-Pesa ${phone}`,
    })

    // Create notification
    await supabaseServer.from('notifications').insert({
      user_id: user.id,
      type: 'withdrawal',
      title: 'Withdrawal Requested',
      body: `Your withdrawal of ${currency} ${amount.toLocaleString()} is being processed.`,
      data: { reference, amount, phone } as Record<string, unknown>,
    })

    // TODO: In production, trigger Paystack Transfer API here:
    // POST https://api.paystack.co/transfer with Authorization: Bearer {PAYSTACK_SECRET_KEY}
    // This initiates an M-Pesa or bank transfer to the user

    return NextResponse.json({
      success: true,
      reference,
      message: 'Withdrawal request submitted. Processing within 24 hours.',
    })
  } catch (err) {
    console.error('Withdrawal error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
