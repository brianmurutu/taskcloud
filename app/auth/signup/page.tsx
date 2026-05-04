'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const COUNTRIES = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Nigeria', 'Ghana',
  'South Africa', 'United States', 'United Kingdom', 'India', 'Other'
]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Kenya',
    password: '',
    confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName },
        },
      })
      if (error) throw error

      // Update profile with additional info
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: form.email,
          full_name: form.fullName,
          phone: form.phone,
          country: form.country,
        })
      }

      toast.success('Account created! Please check your email to verify.')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-4 mesh-bg">
      <div className="w-full max-w-md animate-scale-in">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center">
            <Zap size={18} className="text-black" />
          </div>
          <span className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>TaskCloud</span>
        </Link>

        <div className="card">
          <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>
            Create your account
          </h1>
          <p className="text-gray-500 text-sm mb-8">Free forever. No credit card required.</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Jane Wanjiku"
                value={form.fullName}
                onChange={e => update('fullName', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input-field"
                placeholder="jane@example.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+254 7xx xxx xxx"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Country</label>
                <div className="relative">
                  <select
                    className="input-field appearance-none pr-10"
                    value={form.country}
                    onChange={e => update('country', e.target.value)}
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-12"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={e => update('confirmPassword', e.target.value)}
                required
              />
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-gray-500 hover:text-green-400">Terms & Conditions</Link>,{' '}
              <Link href="/privacy" className="text-gray-500 hover:text-green-400">Privacy Policy</Link>, and{' '}
              <Link href="/refund" className="text-gray-500 hover:text-green-400">Refund Policy</Link>.
            </p>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Creating account...' : 'Create Free Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1e2b1e] text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-400 hover:text-green-300 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
