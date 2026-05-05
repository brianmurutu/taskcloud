'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowDownLeft, ArrowUpRight, Loader2, RefreshCw, Info, CreditCard } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase as supabaseClient } from '@/lib/supabase'
const supabase = supabaseClient as any
import { Transaction } from '@/types/database'
import {
  formatCurrency, generateReference, toPaystackAmount,
  PLATFORM_FEE_PERCENT, PAYSTACK_PUBLIC_KEY
} from '@/lib/paystack'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: Record<string, unknown>) => { openIframe: () => void }
    }
  }
}

const TX_ICONS: Record<string, string> = {
  deposit: '↓',
  withdrawal: '↑',
  payment_sent: '→',
  payment_received: '←',
  refund: '↺',
  fee: '✂',
}

const TX_COLORS: Record<string, string> = {
  deposit: 'text-green-400',
  payment_received: 'text-green-400',
  refund: 'text-green-400',
  withdrawal: 'text-red-400',
  payment_sent: 'text-red-400',
  fee: 'text-red-400',
}

export default function WalletPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawPhone, setWithdrawPhone] = useState(profile?.phone || '')
  const [currency, setCurrency] = useState<'KES' | 'USD'>(profile?.wallet_currency as 'KES' | 'USD' || 'KES')
  const [tab, setTab] = useState<'overview' | 'deposit' | 'withdraw'>('overview')
  const [processing, setProcessing] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setTransactions((data as Transaction[]) || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const handleDeposit = async () => {
    if (!user || !profile) return
    const amount = parseFloat(depositAmount)
    if (!amount || amount < 100) {
      toast.error(`Minimum deposit is ${formatCurrency(100, currency)}`)
      return
    }

    const reference = generateReference('DEP')

    if (typeof window === 'undefined' || !window.PaystackPop) {
      toast.error('Payment system not loaded. Please refresh.')
      return
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: profile.email,
      amount: toPaystackAmount(amount, currency),
      currency,
      ref: reference,
      metadata: { user_id: user.id, type: 'deposit' },
      callback: async (response: { reference: string }) => {
        setProcessing(true)
        try {
          // Verify on server
          const res = await fetch('/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference: response.reference, type: 'deposit', amount, currency }),
          })
          const data = await res.json()
          if (data.success) {
            toast.success(`${formatCurrency(amount, currency)} added to wallet!`)
            setDepositAmount('')
            setTab('overview')
            await refreshProfile()
            fetchTransactions()
          } else {
            toast.error(data.error || 'Payment verification failed')
          }
        } catch {
          toast.error('Payment processing failed')
        } finally {
          setProcessing(false)
        }
      },
      onClose: () => toast('Payment cancelled'),
    })

    handler.openIframe()
  }

  const handleWithdraw = async () => {
    if (!user || !profile) return
    const amount = parseFloat(withdrawAmount)
    if (!amount || amount < 100) {
      toast.error(`Minimum withdrawal is ${formatCurrency(100, currency)}`)
      return
    }
    if (amount > (profile.wallet_balance || 0)) {
      toast.error('Insufficient wallet balance')
      return
    }
    if (!withdrawPhone) {
      toast.error('Please enter your M-Pesa phone number')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency, phone: withdrawPhone }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Withdrawal request submitted! You\'ll receive your payment shortly.')
        setWithdrawAmount('')
        setTab('overview')
        await refreshProfile()
        fetchTransactions()
      } else {
        toast.error(data.error || 'Withdrawal failed')
      }
    } catch {
      toast.error('Withdrawal failed')
    } finally {
      setProcessing(false)
    }
  }

  const walletBalance = profile?.wallet_balance || 0
  const walletCurrency = profile?.wallet_currency as 'KES' | 'USD' || 'KES'

  // Stats
  const totalIn = transactions
    .filter(t => ['deposit', 'payment_received', 'refund'].includes(t.type) && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0)
  const totalOut = transactions
    .filter(t => ['withdrawal', 'payment_sent', 'fee'].includes(t.type) && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Wallet</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your funds. Deposit via Paystack, withdraw to M-Pesa or bank.</p>
      </div>

      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20">
        <div className="text-gray-500 text-sm mb-1">Available Balance</div>
        <div className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
          {formatCurrency(walletBalance, walletCurrency)}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-black/20 rounded-xl">
            <div className="text-gray-600 text-xs mb-1">Total In</div>
            <div className="text-green-400 font-semibold">{formatCurrency(totalIn, walletCurrency)}</div>
          </div>
          <div className="p-3 bg-black/20 rounded-xl">
            <div className="text-gray-600 text-xs mb-1">Total Out</div>
            <div className="text-red-400 font-semibold">{formatCurrency(totalOut, walletCurrency)}</div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setTab(tab === 'deposit' ? 'overview' : 'deposit')}
            className="btn-primary flex items-center gap-2 text-sm flex-1"
          >
            <ArrowDownLeft size={14} /> Deposit
          </button>
          <button
            onClick={() => setTab(tab === 'withdraw' ? 'overview' : 'withdraw')}
            className="btn-secondary flex items-center gap-2 text-sm flex-1"
          >
            <ArrowUpRight size={14} /> Withdraw
          </button>
        </div>
      </div>

      {/* Deposit Form */}
      {tab === 'deposit' && (
        <div className="card animate-slide-up">
          <h2 className="font-semibold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            <CreditCard size={16} className="inline mr-2 text-green-400" />
            Deposit Funds
          </h2>

          <div className="flex rounded-xl border border-[#1e2b1e] overflow-hidden mb-4">
            {(['KES', 'USD'] as const).map(c => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  currency === c ? 'bg-green-500/15 text-green-400' : 'text-gray-500 bg-[#0e1a0e]'
                }`}
              >
                {c === 'KES' ? '🇰🇪 Kenyan Shilling (KES)' : '🇺🇸 US Dollar (USD)'}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="label">Amount ({currency})</label>
            <input
              type="number"
              className="input-field text-xl font-semibold"
              placeholder={currency === 'KES' ? '500' : '5'}
              min={currency === 'KES' ? 100 : 1}
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
            />
          </div>

          {/* Quick amounts */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(currency === 'KES' ? [500, 1000, 2000, 5000] : [5, 10, 25, 50]).map(amt => (
              <button
                key={amt}
                onClick={() => setDepositAmount(String(amt))}
                className="badge badge-gray cursor-pointer hover:badge-green transition-colors"
              >
                {formatCurrency(amt, currency)}
              </button>
            ))}
          </div>

          <div className="p-3 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] text-xs text-gray-500 flex gap-2 mb-4">
            <Info size={12} className="mt-0.5 text-green-400 shrink-0" />
            Payments are processed securely via Paystack. Supports card, M-Pesa, bank transfer.
          </div>

          <button
            onClick={handleDeposit}
            disabled={processing || !depositAmount}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {processing && <Loader2 size={16} className="animate-spin" />}
            {processing ? 'Processing...' : `Deposit ${depositAmount ? formatCurrency(parseFloat(depositAmount), currency) : 'via Paystack'}`}
          </button>
        </div>
      )}

      {/* Withdraw Form */}
      {tab === 'withdraw' && (
        <div className="card animate-slide-up">
          <h2 className="font-semibold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
            <ArrowUpRight size={16} className="inline mr-2 text-green-400" />
            Withdraw Funds
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Amount ({walletCurrency})</label>
              <input
                type="number"
                className="input-field"
                placeholder="100"
                min="100"
                max={walletBalance}
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
              />
              <div className="text-xs text-gray-600 mt-1">
                Available: {formatCurrency(walletBalance, walletCurrency)}
              </div>
            </div>

            <div>
              <label className="label">M-Pesa Phone Number</label>
              <input
                type="tel"
                className="input-field"
                placeholder="+254 7xx xxx xxx"
                value={withdrawPhone}
                onChange={e => setWithdrawPhone(e.target.value)}
              />
            </div>

            <div className="p-3 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] text-xs text-gray-500 flex gap-2">
              <Info size={12} className="mt-0.5 text-amber-400 shrink-0" />
              Withdrawals are processed within 1-24 hours. Bank transfer may take 1-2 business days.
            </div>

            <button
              onClick={handleWithdraw}
              disabled={processing || !withdrawAmount || !withdrawPhone}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {processing && <Loader2 size={16} className="animate-spin" />}
              {processing ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Transaction History
          </h2>
          <button onClick={fetchTransactions} className="btn-ghost p-2">
            <RefreshCw size={14} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">
            No transactions yet. Deposit funds to get started.
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-3 border-b border-[#1e2b1e] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-[#0e1a0e] border border-[#1e2b1e] flex items-center justify-center text-sm font-mono ${TX_COLORS[tx.type] || 'text-gray-400'}`}>
                    {TX_ICONS[tx.type] || '?'}
                  </div>
                  <div>
                    <div className="text-sm text-gray-300">
                      {tx.description || tx.type.replace(/_/g, ' ')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(tx.created_at), 'MMM d, yyyy · h:mm a')}
                      {tx.reference && (
                        <span className="ml-2 font-mono text-[10px] text-gray-700">#{tx.reference.slice(-8)}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm ${TX_COLORS[tx.type] || 'text-gray-400'}`}>
                    {['deposit', 'payment_received', 'refund'].includes(tx.type) ? '+' : '-'}
                    {formatCurrency(tx.amount, tx.currency as 'KES' | 'USD')}
                  </div>
                  <span className={`badge text-xs ${
                    tx.status === 'completed' ? 'badge-green' :
                    tx.status === 'failed' ? 'badge-red' : 'badge-amber'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
