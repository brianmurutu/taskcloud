'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, X, Info } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/types/database'
import { calculateFee, formatCurrency } from '@/lib/paystack'
import toast from 'react-hot-toast'

export default function PostTaskPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    currency: 'KES' as 'KES' | 'USD',
    deadline: '',
    max_applications: '10',
    required_skills: [] as string[],
  })

  const update = (k: string, v: string | string[]) => setForm(f => ({ ...f, [k]: v }))

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.required_skills.includes(s) && form.required_skills.length < 8) {
      update('required_skills', [...form.required_skills, s])
      setSkillInput('')
    }
  }

  const removeSkill = (s: string) => update('required_skills', form.required_skills.filter(x => x !== s))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!form.title || !form.description || !form.category || !form.budget || !form.deadline) {
      toast.error('Please fill in all required fields')
      return
    }
    const budget = parseFloat(form.budget)
    if (isNaN(budget) || budget <= 0) {
      toast.error('Please enter a valid budget')
      return
    }
    if (new Date(form.deadline) <= new Date()) {
      toast.error('Deadline must be in the future')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.from('tasks').insert({
        title: form.title,
        description: form.description,
        category: form.category,
        budget,
        currency: form.currency,
        deadline: form.deadline,
        max_applications: parseInt(form.max_applications),
        required_skills: form.required_skills,
        poster_id: user.id,
        status: 'open',
      }).select().single()

      if (error) throw error

      // Update tasks_posted count
      await supabase.from('profiles').update({
        tasks_posted: (profile?.tasks_posted || 0) + 1
      }).eq('id', user.id)

      toast.success('Task posted successfully!')
      router.push(`/tasks/${data.id}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to post task')
    } finally {
      setLoading(false)
    }
  }

  const budget = parseFloat(form.budget) || 0
  const fee = calculateFee(budget)
  const payout = budget - fee

  // Minimum deadline is tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
          Post a New Task
        </h1>
        <p className="text-gray-500 text-sm mt-1">Describe your task clearly to attract the best taskers</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
            Task Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Task Title *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Research the top 10 electric vehicle brands in Kenya"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                maxLength={120}
                required
              />
              <div className="text-xs text-gray-600 mt-1">{form.title.length}/120 characters</div>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                className="input-field resize-none h-40"
                placeholder="Describe exactly what you need done, any specific requirements, format of delivery, etc."
                value={form.description}
                onChange={e => update('description', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Category *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => update('category', cat.name)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      form.category === cat.name
                        ? 'border-green-500/60 bg-green-500/10 text-green-400'
                        : 'border-[#1e2b1e] text-gray-500 hover:text-gray-300 hover:border-gray-600 bg-[#0e1a0e]'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Budget & Deadline */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
            Budget & Timeline
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Budget *</label>
                <div className="relative">
                  <input
                    type="number"
                    className="input-field pr-20"
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    value={form.budget}
                    onChange={e => update('budget', e.target.value)}
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex rounded-lg overflow-hidden border border-[#1e2b1e]">
                    {(['KES', 'USD'] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update('currency', c)}
                        className={`px-2 py-0.5 text-xs transition-colors ${
                          form.currency === c ? 'bg-green-500/20 text-green-400' : 'text-gray-600 bg-[#0a0f0d]'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Deadline *</label>
                <input
                  type="date"
                  className="input-field"
                  min={minDate}
                  value={form.deadline}
                  onChange={e => update('deadline', e.target.value)}
                  required
                />
              </div>
            </div>

            {budget > 0 && (
              <div className="p-4 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] text-sm">
                <div className="flex items-start gap-2 text-gray-500 mb-3">
                  <Info size={14} className="mt-0.5 text-green-400 shrink-0" />
                  <span>Payment breakdown for tasker</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Task budget</span>
                    <span className="text-white">{formatCurrency(budget, form.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Platform fee (5%)</span>
                    <span className="text-red-400">-{formatCurrency(fee, form.currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#1e2b1e] pt-1.5 font-semibold">
                    <span className="text-gray-400">Tasker receives</span>
                    <span className="text-green-400">{formatCurrency(payout, form.currency)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="label">Max Applications</label>
              <select
                className="input-field"
                value={form.max_applications}
                onChange={e => update('max_applications', e.target.value)}
              >
                {[5, 10, 15, 20, 30, 50].map(n => (
                  <option key={n} value={n}>{n} applicants</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
            Required Skills <span className="text-gray-600 font-normal">(optional)</span>
          </h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              className="input-field flex-1"
              placeholder="e.g., Research, Excel, Swahili..."
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <button
              type="button"
              onClick={addSkill}
              className="btn-ghost px-3"
            >
              <Plus size={16} />
            </button>
          </div>
          {form.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.required_skills.map(s => (
                <span key={s} className="badge badge-green flex items-center gap-1">
                  {s}
                  <button type="button" onClick={() => removeSkill(s)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Posting...' : 'Post Task'}
          </button>
          <p className="text-xs text-gray-600">
            Free to post. You&apos;ll fund the escrow when you accept a tasker.
          </p>
        </div>
      </form>
    </div>
  )
}
