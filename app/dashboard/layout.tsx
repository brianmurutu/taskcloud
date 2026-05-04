'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, ListTodo, PlusCircle, Briefcase,
  Wallet, MessageSquare, User, LogOut, Zap, Bell
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { formatCurrency } from '@/lib/paystack'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/tasks', icon: ListTodo, label: 'Browse Tasks' },
  { href: '/dashboard/post-task', icon: PlusCircle, label: 'Post Task' },
  { href: '/dashboard/my-tasks', icon: Briefcase, label: 'My Tasks' },
  { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
  { href: '/dashboard/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/dashboard/profile', icon: User, label: 'Profile' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  if (loading || !user) return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-[#1e2b1e] bg-[#0d140d] hidden lg:flex flex-col">
        <div className="h-16 flex items-center gap-2 px-6 border-b border-[#1e2b1e]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>TaskCloud</span>
          </Link>
        </div>

        {/* Profile card */}
        <div className="p-4 border-b border-[#1e2b1e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/20 flex items-center justify-center text-green-400 font-bold text-sm shrink-0">
              {profile?.full_name?.slice(0, 2).toUpperCase() || 'TC'}
            </div>
            <div className="min-w-0">
              <div className="font-medium text-white text-sm truncate" style={{ fontFamily: 'Sora, sans-serif' }}>
                {profile?.full_name}
              </div>
              <div className="text-xs text-gray-600 truncate">{profile?.email}</div>
            </div>
          </div>
          <div className="mt-3 p-2.5 bg-[#0e1a0e] rounded-lg border border-[#1e2b1e]">
            <div className="text-xs text-gray-600">Wallet Balance</div>
            <div className="font-bold text-green-400 text-sm">
              {formatCurrency(profile?.wallet_balance || 0, profile?.wallet_currency as 'KES' | 'USD' || 'KES')}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  active
                    ? 'bg-green-500/15 text-green-400 font-medium'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[#1e2b1e]">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 w-full transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-[#1e2b1e] bg-[#0a0f0d]/90 backdrop-blur-xl flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
            <Zap size={14} className="text-black" />
          </div>
          <span className="font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>TaskCloud</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/messages" className="btn-ghost p-2"><MessageSquare size={16} /></Link>
          <Link href="/dashboard/profile" className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
            {profile?.full_name?.slice(0, 2).toUpperCase()}
          </Link>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 lg:overflow-auto">
        <div className="pt-14 lg:pt-0 min-h-screen">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-[#1e2b1e] bg-[#0a0f0d]/90 backdrop-blur-xl flex">
        {[
          { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
          { href: '/dashboard/tasks', icon: ListTodo, label: 'Tasks' },
          { href: '/dashboard/post-task', icon: PlusCircle, label: 'Post' },
          { href: '/dashboard/wallet', icon: Wallet, label: 'Wallet' },
          { href: '/dashboard/profile', icon: User, label: 'Profile' },
        ].map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 ${active ? 'text-green-400' : 'text-gray-600'}`}>
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
