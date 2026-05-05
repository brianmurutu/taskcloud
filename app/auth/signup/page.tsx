'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, Loader2, ChevronDown } from 'lucide-react'
import { supabase as supabaseClient } from '@/lib/supabase'
const supabase = supabaseClient as any
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
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { 
            full_name: form.fullName,
            phone: form.phone,
            country: form.country
          },
        },
      })
      if (error) throw error

      toast.success('Account created! Please check your email to verify.')
      router.push('/dashboard')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google login failed')
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e2b1e]"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111916] px-2 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full h-11 bg-white hover:bg-gray-100 text-black font-medium rounded-xl flex items-center justify-center gap-3 transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>

          <div className="mt-6 pt-6 border-t border-[#1e2b1e] text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-green-400 hover:text-green-300 font-medium">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
