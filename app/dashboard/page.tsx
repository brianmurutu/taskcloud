'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, CheckCircle, Clock, DollarSign, PlusCircle, Search } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase as supabaseClient } from '@/lib/supabase'
const supabase = supabaseClient as any
import { Task, Application, Transaction } from '@/types/database'
import { formatCurrency } from '@/lib/paystack'
import { formatDistanceToNow } from 'date-fns'

export default function DashboardPage() {
  const { profile, user } = useAuth()
  const [recentTasks, setRecentTasks] = useState<Task[]>([])
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const loadData = async () => {
      const [tasks, apps, txns] = await Promise.all([
        supabase.from('tasks').select('*').eq('poster_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('applications').select('*, task:tasks(*)').eq('applicant_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])
      setRecentTasks((tasks.data as Task[]) || [])
      setMyApplications((apps.data as Application[]) || [])
      setRecentTransactions((txns.data as Transaction[]) || [])
      setLoading(false)
    }
    loadData()
  }, [user])

  const currency = profile?.wallet_currency as 'KES' | 'USD' || 'KES'

  const statCards = [
    {
      label: 'Wallet Balance',
      value: formatCurrency(profile?.wallet_balance || 0, currency),
      icon: DollarSign,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      href: '/dashboard/wallet',
    },
    {
      label: 'Tasks Posted',
      value: profile?.tasks_posted || 0,
      icon: PlusCircle,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/dashboard/my-tasks',
    },
    {
      label: 'Tasks Completed',
      value: profile?.tasks_completed || 0,
      icon: CheckCircle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      href: '/dashboard/my-tasks',
    },
    {
      label: 'Rating',
      value: profile?.rating ? `${profile.rating.toFixed(1)} ★` : 'No ratings',
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      href: '/dashboard/profile',
    },
  ]

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
            Welcome back, {profile?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening on your account</p>
        </div>
        <Link href="/dashboard/post-task" className="btn-primary hidden sm:flex items-center gap-2 text-sm">
          <PlusCircle size={14} /> Post Task
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Link key={s.label} href={s.href} className="card-hover">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div className={`text-xl font-bold ${s.color}`} style={{ fontFamily: 'Sora, sans-serif' }}>
              {s.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/tasks" className="p-4 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] hover:border-green-500/30 transition-colors group">
              <Search size={20} className="text-green-400 mb-2" />
              <div className="text-sm font-medium text-white">Browse Tasks</div>
              <div className="text-xs text-gray-600">Find work to do</div>
            </Link>
            <Link href="/dashboard/post-task" className="p-4 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] hover:border-green-500/30 transition-colors group">
              <PlusCircle size={20} className="text-green-400 mb-2" />
              <div className="text-sm font-medium text-white">Post a Task</div>
              <div className="text-xs text-gray-600">Get things done</div>
            </Link>
            <Link href="/dashboard/wallet" className="p-4 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] hover:border-green-500/30 transition-colors group">
              <DollarSign size={20} className="text-amber-400 mb-2" />
              <div className="text-sm font-medium text-white">Fund Wallet</div>
              <div className="text-xs text-gray-600">Top up via Paystack</div>
            </Link>
            <Link href="/dashboard/messages" className="p-4 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] hover:border-green-500/30 transition-colors group">
              <Clock size={20} className="text-blue-400 mb-2" />
              <div className="text-sm font-medium text-white">Messages</div>
              <div className="text-xs text-gray-600">Chat with taskers</div>
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Recent Transactions</h2>
            <Link href="/dashboard/wallet" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-gray-300">{tx.description || tx.type.replace('_', ' ')}</div>
                    <div className="text-xs text-gray-600">
                      {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    ['deposit', 'payment_received', 'refund'].includes(tx.type) ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {['deposit', 'payment_received', 'refund'].includes(tx.type) ? '+' : '-'}
                    {formatCurrency(tx.amount, tx.currency as 'KES' | 'USD')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Posted Tasks */}
      {recentTasks.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>My Posted Tasks</h2>
            <Link href="/dashboard/my-tasks" className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.map(task => (
              <Link
                key={task.id}
                href={`/tasks/${task.id}`}
                className="flex items-center justify-between p-3 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] hover:border-green-500/20 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-white line-clamp-1">{task.title}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{task.application_count} applications</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-green-400">
                    {formatCurrency(task.budget, task.currency as 'KES' | 'USD')}
                  </div>
                  <span className={`badge text-xs mt-1 ${
                    task.status === 'open' ? 'badge-green' :
                    task.status === 'completed' ? 'badge-gray' : 'badge-blue'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* My Applications */}
      {myApplications.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>My Applications</h2>
          </div>
          <div className="space-y-3">
            {myApplications.map(app => (
              <Link
                key={app.id}
                href={`/tasks/${app.task_id}`}
                className="flex items-center justify-between p-3 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] hover:border-green-500/20 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-white line-clamp-1">
                    {(app.task as Task)?.title || 'Task'}
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                  </div>
                </div>
                <span className={`badge text-xs ${
                  app.status === 'accepted' ? 'badge-green' :
                  app.status === 'rejected' ? 'badge-red' : 'badge-amber'
                }`}>
                  {app.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
