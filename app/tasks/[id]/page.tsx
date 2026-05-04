'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, User, Clock, Star, Shield,
  MessageSquare, ChevronDown, ChevronUp, Loader2, Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Task, Application } from '@/types/database'
import { formatCurrency, calculateFee } from '@/lib/paystack'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

export default function TaskDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, profile } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [proposedAmount, setProposedAmount] = useState('')
  const [myApplication, setMyApplication] = useState<Application | null>(null)

  useEffect(() => {
    fetchTask()
  }, [id])

  const fetchTask = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('tasks')
        .select('*, poster:profiles!poster_id(*)')
        .eq('id', id)
        .single()

      if (data) {
        setTask(data as Task)
        // Increment views
        await supabase.rpc('increment_views', { task_id: id })
      }

      if (user) {
        const { data: app } = await supabase
          .from('applications')
          .select('*')
          .eq('task_id', id)
          .eq('applicant_id', user.id)
          .single()
        if (app) setMyApplication(app as Application)

        // If poster, fetch applications
        if (data?.poster_id === user.id) {
          const { data: apps } = await supabase
            .from('applications')
            .select('*, applicant:profiles!applicant_id(*)')
            .eq('task_id', id)
            .order('created_at', { ascending: false })
          setApplications((apps as Application[]) || [])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    if (!coverLetter.trim()) {
      toast.error('Please write a cover letter')
      return
    }
    setApplying(true)
    try {
      const { error } = await supabase.from('applications').insert({
        task_id: id as string,
        applicant_id: user.id,
        cover_letter: coverLetter,
        proposed_amount: proposedAmount ? parseFloat(proposedAmount) : null,
        status: 'pending',
      })
      if (error) throw error
      toast.success('Application submitted!')
      setShowApplyForm(false)
      fetchTask()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  const handleAcceptApplication = async (appId: string, applicantId: string) => {
    try {
      await supabase.from('applications').update({ status: 'accepted' }).eq('id', appId)
      await supabase.from('tasks').update({ status: 'assigned', assignee_id: applicantId }).eq('id', id)
      // Reject all others
      await supabase.from('applications')
        .update({ status: 'rejected' })
        .eq('task_id', id)
        .neq('id', appId)
      toast.success('Tasker accepted!')
      fetchTask()
    } catch {
      toast.error('Failed to accept application')
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-green-400" />
    </div>
  )

  if (!task) return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Task Not Found</h2>
        <Link href="/tasks" className="text-green-400">Browse all tasks</Link>
      </div>
    </div>
  )

  const isOwner = user?.id === task.poster_id
  const isAssignee = user?.id === task.assignee_id
  const canApply = !isOwner && !myApplication && task.status === 'open'
  const isPastDeadline = new Date(task.deadline) < new Date()

  const statusBadge: Record<string, string> = {
    open: 'badge-green',
    assigned: 'badge-blue',
    in_progress: 'badge-blue',
    submitted: 'badge-amber',
    completed: 'badge-green',
    cancelled: 'badge-gray',
    disputed: 'badge-red',
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      <nav className="sticky top-0 z-50 border-b border-[#1e2b1e] bg-[#0a0f0d]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>TaskCloud</span>
          </Link>
          {user ? (
            <Link href="/dashboard" className="btn-ghost text-sm">Dashboard</Link>
          ) : (
            <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/tasks" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to Tasks
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`badge ${statusBadge[task.status] || 'badge-gray'}`}>
                  {task.status.replace('_', ' ')}
                </span>
                <span className="badge badge-gray">{task.category}</span>
                {task.is_featured && <span className="badge badge-amber">⭐ Featured</span>}
              </div>

              <h1 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
                {task.title}
              </h1>

              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>

              {task.required_skills && task.required_skills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-[#1e2b1e]">
                  <div className="text-sm font-medium text-gray-400 mb-3">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {task.required_skills.map(s => (
                      <span key={s} className="badge badge-gray">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Apply Form */}
            {canApply && !isPastDeadline && (
              <div className="card border-green-500/20">
                <button
                  onClick={() => setShowApplyForm(!showApplyForm)}
                  className="w-full flex items-center justify-between"
                >
                  <span className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>
                    Apply for this Task
                  </span>
                  {showApplyForm ? <ChevronUp size={16} className="text-green-400" /> : <ChevronDown size={16} className="text-green-400" />}
                </button>

                {showApplyForm && (
                  <div className="mt-6 space-y-4 animate-slide-up">
                    <div>
                      <label className="label">Cover Letter *</label>
                      <textarea
                        className="input-field resize-none h-32"
                        placeholder="Introduce yourself and explain why you're the best fit for this task..."
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">
                        Proposed Amount ({task.currency}) <span className="text-gray-600">(optional)</span>
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder={`Default: ${task.budget}`}
                        value={proposedAmount}
                        onChange={e => setProposedAmount(e.target.value)}
                      />
                    </div>
                    {proposedAmount && (
                      <div className="p-3 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e] text-sm text-gray-500">
                        You'll receive:{' '}
                        <span className="text-green-400 font-semibold">
                          {formatCurrency(parseFloat(proposedAmount) * 0.95, task.currency as 'KES' | 'USD')}
                        </span>
                        {' '}(after 5% platform fee)
                      </div>
                    )}
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      {applying && <Loader2 size={16} className="animate-spin" />}
                      Submit Application
                    </button>
                  </div>
                )}
              </div>
            )}

            {myApplication && (
              <div className="card border-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Clock size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">Application {myApplication.status}</div>
                    <div className="text-xs text-gray-500">
                      Submitted {formatDistanceToNow(new Date(myApplication.created_at), { addSuffix: true })}
                    </div>
                  </div>
                  <span className={`ml-auto badge ${
                    myApplication.status === 'accepted' ? 'badge-green' :
                    myApplication.status === 'rejected' ? 'badge-red' : 'badge-amber'
                  }`}>
                    {myApplication.status}
                  </span>
                </div>
              </div>
            )}

            {!user && (
              <div className="card border-green-500/20 text-center">
                <Shield size={32} className="text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Sign in to Apply
                </h3>
                <p className="text-gray-500 text-sm mb-4">Create a free account to bid on this task</p>
                <Link href="/auth/signup" className="btn-primary inline-flex">Get Started Free</Link>
              </div>
            )}

            {/* Owner: Applications */}
            {isOwner && applications.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-white mb-4" style={{ fontFamily: 'Sora, sans-serif' }}>
                  Applications ({applications.length})
                </h3>
                <div className="space-y-4">
                  {applications.map(app => (
                    <div key={app.id} className="p-4 bg-[#0e1a0e] rounded-xl border border-[#1e2b1e]">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
                            {app.applicant?.full_name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">{app.applicant?.full_name}</div>
                            <div className="flex items-center gap-1 text-xs text-amber-400">
                              <Star size={10} className="fill-current" />
                              {app.applicant?.rating?.toFixed(1) || 'New'}
                            </div>
                          </div>
                        </div>
                        {app.proposed_amount && (
                          <div className="text-green-400 font-semibold text-sm">
                            {formatCurrency(app.proposed_amount, task.currency as 'KES' | 'USD')}
                          </div>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed mb-3">{app.cover_letter}</p>
                      <div className="flex items-center gap-2">
                        {app.status === 'pending' && task.status === 'open' && (
                          <button
                            onClick={() => handleAcceptApplication(app.id, app.applicant_id)}
                            className="btn-primary py-1.5 text-xs"
                          >
                            Accept
                          </button>
                        )}
                        <Link href={`/dashboard/messages?with=${app.applicant_id}`} className="btn-ghost py-1.5 text-xs flex items-center gap-1">
                          <MessageSquare size={12} /> Message
                        </Link>
                        <span className={`ml-auto badge text-xs ${
                          app.status === 'accepted' ? 'badge-green' :
                          app.status === 'rejected' ? 'badge-red' : 'badge-gray'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Budget */}
            <div className="card">
              <div className="text-gray-500 text-xs mb-1">Budget</div>
              <div className="text-3xl font-bold text-green-400" style={{ fontFamily: 'Sora, sans-serif' }}>
                {formatCurrency(task.budget, task.currency as 'KES' | 'USD')}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                You receive: {formatCurrency(task.budget * 0.95, task.currency as 'KES' | 'USD')} (after 5% fee)
              </div>
            </div>

            {/* Details */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Calendar size={14} /> Deadline</span>
                <span className={`font-medium ${isPastDeadline ? 'text-red-400' : 'text-white'}`}>
                  {format(new Date(task.deadline), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><User size={14} /> Applications</span>
                <span className="font-medium text-white">{task.application_count} / {task.max_applications}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Currency</span>
                <span className="font-medium text-white">{task.currency}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Posted</span>
                <span className="font-medium text-white">
                  {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>

            {/* Poster */}
            {task.poster && (
              <div className="card">
                <div className="text-xs text-gray-500 mb-3">Posted by</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/20 flex items-center justify-center text-green-400 text-sm font-bold">
                    {task.poster.full_name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-white text-sm">{task.poster.full_name}</div>
                    <div className="flex items-center gap-1 text-xs text-amber-400">
                      <Star size={10} className="fill-current" />
                      <span>{task.poster.rating?.toFixed(1) || 'New'}</span>
                      <span className="text-gray-600">({task.poster.total_reviews} reviews)</span>
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{task.poster.tasks_posted} tasks posted</div>
                  </div>
                </div>
                {user && user.id !== task.poster_id && (
                  <Link
                    href={`/dashboard/messages?with=${task.poster_id}&task=${task.id}`}
                    className="btn-ghost w-full mt-4 text-sm flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={14} /> Message Poster
                  </Link>
                )}
              </div>
            )}

            {/* Trust badges */}
            <div className="card">
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium mb-3">
                <Shield size={14} /> Secure Transaction
              </div>
              <ul className="space-y-1.5 text-xs text-gray-500">
                <li>✓ Payment held in escrow</li>
                <li>✓ Released only after approval</li>
                <li>✓ Dispute resolution available</li>
                <li>✓ Powered by Paystack</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
