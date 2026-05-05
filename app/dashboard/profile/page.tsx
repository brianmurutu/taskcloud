'use client'

import { useState } from 'react'
import { Loader2, Star, CheckCircle, X, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase as supabaseClient } from '@/lib/supabase'
const supabase = supabaseClient as any
import toast from 'react-hot-toast'

const COUNTRIES = [
  'Kenya', 'Uganda', 'Tanzania', 'Rwanda', 'Ethiopia', 'Nigeria',
  'Ghana', 'South Africa', 'United States', 'United Kingdom', 'India', 'Other'
]

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    country: profile?.country || 'Kenya',
    bio: profile?.bio || '',
    skills: profile?.skills || [] as string[],
  })

  const update = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s) && form.skills.length < 12) {
      update('skills', [...form.skills, s])
      setSkillInput('')
    }
  }

  const removeSkill = (s: string) => update('skills', form.skills.filter(x => x !== s))

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          country: form.country,
          bio: form.bio,
          skills: form.skills,
        })
        .eq('id', profile.id)

      if (error) throw error
      await refreshProfile()
      toast.success('Profile updated!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!profile) return null

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your public profile and settings</p>
      </div>

      {/* Profile Summary */}
      <div className="card bg-gradient-to-r from-green-500/5 to-transparent border-green-500/10">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 border-2 border-green-500/20 flex items-center justify-center text-green-400 text-2xl font-bold shrink-0">
            {profile.full_name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
              {profile.full_name}
            </h2>
            <p className="text-gray-500 text-sm">{profile.email} · {profile.country}</p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
              <div className="flex items-center gap-1 text-amber-400">
                <Star size={13} className="fill-current" />
                <span className="font-semibold">{profile.rating?.toFixed(1) || 'No rating'}</span>
                <span className="text-gray-600">({profile.total_reviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <CheckCircle size={13} className="text-green-400" />
                {profile.tasks_completed} completed
              </div>
              <div className="text-gray-500">
                {profile.tasks_posted} posted
              </div>
              {profile.is_verified && (
                <span className="badge badge-green">✓ Verified</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card space-y-5">
        <h2 className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Personal Information</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              className="input-field"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
            />
          </div>
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
        </div>

        <div>
          <label className="label">Country</label>
          <select
            className="input-field"
            value={form.country}
            onChange={e => update('country', e.target.value)}
          >
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Bio</label>
          <textarea
            className="input-field resize-none h-28"
            placeholder="Tell clients and taskers about yourself, your experience, and what you do..."
            value={form.bio}
            onChange={e => update('bio', e.target.value)}
            maxLength={500}
          />
          <div className="text-xs text-gray-600 mt-1">{form.bio.length}/500</div>
        </div>

        <div>
          <label className="label">Skills</label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="Add a skill (e.g. Research, Excel, Design...)"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <button type="button" onClick={addSkill} className="btn-ghost px-3">
              <Plus size={16} />
            </button>
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map(s => (
                <span key={s} className="badge badge-green flex items-center gap-1">
                  {s}
                  <button onClick={() => removeSkill(s)}><X size={11} /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#1e2b1e] pt-5">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Account</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-[#1e2b1e]">
            <span className="text-gray-400 text-sm">Email</span>
            <span className="text-gray-300 text-sm">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#1e2b1e]">
            <span className="text-gray-400 text-sm">Member since</span>
            <span className="text-gray-300 text-sm">
              {new Date(profile.created_at).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Preferred currency</span>
            <div className="flex rounded-lg border border-[#1e2b1e] overflow-hidden">
              {['KES', 'USD'].map(c => (
                <button
                  key={c}
                  onClick={async () => {
                    await supabase.from('profiles').update({ wallet_currency: c }).eq('id', profile.id)
                    await refreshProfile()
                    toast.success(`Currency set to ${c}`)
                  }}
                  className={`px-3 py-1 text-xs transition-colors ${
                    profile.wallet_currency === c ? 'bg-green-500/20 text-green-400' : 'text-gray-600 bg-[#0a0f0d]'
                  }`}
                >
                  {c === 'KES' ? '🇰🇪 KES' : '🇺🇸 USD'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
