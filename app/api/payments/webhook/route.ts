import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    const supabase = createServerSupabaseClient()

    switch (event.event) {
      case 'charge.success': {
        const { reference, amount, currency, metadata } = event.data
        const userId = metadata?.user_id as string

        if (userId) {
          // Check not already processed
          const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('reference', reference)
            .single()

          if (!existing) {
            const depositAmount = amount / 100

            await supabase.from('transactions').insert({
              user_id: userId,
              type: 'deposit',
              amount: depositAmount,
              currency: (currency as 'KES' | 'USD') || 'KES',
              status: 'completed',
              reference: reference as string,
              description: 'Wallet top-up via Paystack',
              paystack_data: event.data as Record<string, unknown>,
            } as any)

            const { data: profile } = await supabase
              .from('profiles')
              .select('wallet_balance')
              .eq('id', userId)
              .single()

            await supabase.from('profiles').update({
              wallet_balance: (profile?.wallet_balance || 0) + depositAmount
            } as any).eq('id', userId)
          }
        }
        break
      }

      case 'transfer.success': {
        const { reference } = event.data
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('reference', reference)
        break
      }

      case 'transfer.failed': {
        const { reference, amount, currency } = event.data
        const { data: tx } = await supabase
          .from('transactions')
          .select('user_id')
          .eq('reference', reference)
          .single()

        if (tx) {
          // Refund to wallet
          await supabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('reference', reference)

          const { data: profile } = await supabase
            .from('profiles')
            .select('wallet_balance')
            .eq('id', tx.user_id)
            .single()

          await supabase.from('profiles').update({
            wallet_balance: (profile?.wallet_balance || 0) + (amount / 100)
          } as any).eq('id', tx.user_id)

          await supabase.from('notifications').insert({
            user_id: tx.user_id,
            type: 'withdrawal_failed',
            title: 'Withdrawal Failed',
            body: `Your withdrawal of ${currency} ${(amount / 100).toLocaleString()} failed. Funds have been returned to your wallet.`,
          } as any)
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
