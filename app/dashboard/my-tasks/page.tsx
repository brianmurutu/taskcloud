'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PlusCircle, Calendar, Users, CheckCircle, Loader2, Upload } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Task, Application, Submission } from '@/types/database'
import { formatCurrency } from '@/lib/paystack'
import { format, formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

type TabType = 'posted' | 'applications' | 'assigned'

export default function MyTasksPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabType>('posted')
  const [postedTasks, setPostedTasks] = useState<Task[]>([])
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitContent, setSubmitContent] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [posted, apps, assigned] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('poster_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('applications')
        .select('*, task:tasks(*)')
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('*, poster:profiles!poster_id(*), submission:submissions(*)')
        .eq('assignee_id', user.id)
        .order('created_at', { ascending: false }),
    ])
    setPostedTasks((posted.data as Task[]) || [])
    setMyApplications((apps.data as Application[]) || [])
    setAssignedTasks((assigned.data as Task[]) || [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmitWork = async (taskId: string) => {
    const content = submitContent[taskId]
    if (!content?.trim()) {
      toast.error('Please write your submission content')
      return
    }
    setSubmitting(taskId)
    try {
      const { error } = await supabase.from('submissions').insert({
        task_id: taskId,
        tasker_id: user!.id,
        content,
        status: 'pending',
      })
      if (error) throw error

      await supabase.from('tasks').update({ status: 'submitted' }).eq('id', taskId)
      toast.success('Work submitted for review!')
      fetchData()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(null)
    }
  }

  const handleApproveSubmission = async (taskId: string, submission: Submission) => {
    try {
      await supabase.from('submissions').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', submission.id)
      await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId)

      // Get task details for payment
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single()
      if (task) {
        // Release escrow: add to tasker wallet
        const payout = task.budget * 0.95
        await supabase.rpc('credit_wallet', { user_id: submission.tasker_id, amount: payout })
        // Record transactions
        await supabase.from('transactions').insert([
          { user_id: user!.id, type: 'payment_sent', amount: task.budget, currency: task.currency, task_id: taskId, description: `Payment for: ${task.title}`, status: 'completed' },
          { user_id: submission.tasker_id, type: 'payment_received', amount: payout, currency: task.currency, task_id: taskId, description: `Earned from: ${task.title}`, status: 'completed' },
        ])
        // Update completion stats
        const { data: taskerProf } = await supabase.from('profiles').select('tasks_completed').eq('id', submission.tasker_id).single()
        await supabase.from('profiles').update({ tasks_completed: (taskerProf?.tasks_completed || 0) + 1 }).eq('id', submission.tasker_id)
      }

      toast.success('Task approved! Payment released to tasker.')
      fetchData()
    } catch {
      toast.error('Failed to approve submission')
    }
  }

  const TABS = [
    { id: 'posted', label: 'Posted Tasks', count: postedTasks.length },
    { id: 'applications', label: 'My Bids', count: myApplications.length },
    { id: 'assigned', label: 'Assigned to Me', count: assignedTasks.length },
  ]

  const statusBadge: Record<string, string> = {
    open: 'badge-green',
    assigned: 'badge-blue',
    in_progress: 'badge-blue',
    submitted: 'badge-amber',
    completed: 'badge-green',
    cancelled: 'badge-gray',
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>My Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all your tasks in one place</p>
        </div>
        <Link href="/dashboard/post-task" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle size={14} /> New Task
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1e2b1e]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabType)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-green-500 text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-2 badge text-xs ${tab === t.id ? 'badge-green' : 'badge-gray'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-green-400" />
        </div>
      ) : (
        <>
          {/* Posted Tasks */}
          {tab === 'posted' && (
            <div className="space-y-4">
              {postedTasks.length === 0 ? (
                <div className="card text-center py-16">
                  <PlusCircle size={40} className="text-gray-700 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No tasks posted yet</h3>
                  <p className="text-gray-600 text-sm mb-4">Post your first task to get things done</p>
                  <Link href="/dashboard/post-task" className="btn-primary inline-flex">Post a Task</Link>
                </div>
              ) : postedTasks.map(task => (
                <div key={task.id} className="card">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <Link href={`/tasks/${task.id}`} className="font-semibold text-white hover:text-green-400 transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                      {task.title}
                    </Link>
                    <span className={`badge shrink-0 ${statusBadge[task.status] || 'badge-gray'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Users size={13} /> {task.application_count} applicants
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> Due {format(new Date(task.deadline), 'MMM d, yyyy')}
                    </span>
                    <span className="font-semibold text-green-400">
                      {formatCurrency(task.budget, task.currency as 'KES' | 'USD')}
                    </span>
                  </div>

                  {task.status === 'submitted' && (
                    <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                      <p className="text-amber-400 text-sm font-medium mb-2">⏳ Work submitted — awaiting your review</p>
                      <div className="flex gap-3">
                        <Link href={`/tasks/${task.id}`} className="btn-primary text-sm py-1.5">
                          <CheckCircle size={14} className="inline mr-1" /> Review & Approve
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* My Applications */}
          {tab === 'applications' && (
            <div className="space-y-4">
              {myApplications.length === 0 ? (
                <div className="card text-center py-16">
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No applications yet</h3>
                  <Link href="/dashboard/tasks" className="btn-primary inline-flex">Browse Tasks</Link>
                </div>
              ) : myApplications.map(app => {
                const task = app.task as Task
                return (
                  <div key={app.id} className="card">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <Link href={`/tasks/${app.task_id}`} className="font-semibold text-white hover:text-green-400 transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {task?.title}
                      </Link>
                      <span className={`badge shrink-0 ${
                        app.status === 'accepted' ? 'badge-green' :
                        app.status === 'rejected' ? 'badge-red' : 'badge-amber'
                      }`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span>Budget: <span className="text-green-400 font-semibold">{task && formatCurrency(task.budget, task.currency as 'KES' | 'USD')}</span></span>
                      {app.proposed_amount && <span>Your bid: <span className="text-amber-400 font-semibold">{formatCurrency(app.proposed_amount, task?.currency as 'KES' | 'USD')}</span></span>}
                      <span>{formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2 italic">&ldquo;{app.cover_letter}&rdquo;</p>
                  </div>
                )
              })}
            </div>
          )}

          {/* Assigned Tasks */}
          {tab === 'assigned' && (
            <div className="space-y-4">
              {assignedTasks.length === 0 ? (
                <div className="card text-center py-16">
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No assigned tasks yet</h3>
                  <p className="text-gray-600 text-sm mb-4">Apply to tasks and get accepted to see them here</p>
                  <Link href="/dashboard/tasks" className="btn-primary inline-flex">Find Tasks</Link>
                </div>
              ) : assignedTasks.map(task => (
                <div key={task.id} className="card">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{task.title}</h3>
                      <p className="text-xs text-gray-600 mt-0.5">Posted by {task.poster?.full_name}</p>
                    </div>
                    <span className={`badge shrink-0 ${statusBadge[task.status] || 'badge-gray'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} /> Due {format(new Date(task.deadline), 'MMM d, yyyy')}
                    </span>
                    <span className="font-semibold text-green-400">
                      {formatCurrency(task.budget * 0.95, task.currency as 'KES' | 'USD')} <span className="text-gray-600 font-normal text-xs">(your payout)</span>
                    </span>
                  </div>

                  {/* Submit work */}
                  {['assigned', 'in_progress'].includes(task.status) && (
                    <div className="border-t border-[#1e2b1e] pt-4">
                      <label className="label text-xs">Submit Your Work</label>
                      <textarea
                        className="input-field resize-none h-28 text-sm mb-3"
                        placeholder="Paste your completed work here, or describe what you've delivered with any relevant links..."
                        value={submitContent[task.id] || ''}
                        onChange={e => setSubmitContent(prev => ({ ...prev, [task.id]: e.target.value }))}
                      />
                      <button
                        onClick={() => handleSubmitWork(task.id)}
                        disabled={submitting === task.id}
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        {submitting === task.id
                          ? <><Loader2 size={14} className="animate-spin" /> Submitting...</>
                          : <><Upload size={14} /> Submit Work</>
                        }
                      </button>
                    </div>
                  )}

                  {task.status === 'submitted' && (
                    <div className="border-t border-[#1e2b1e] pt-4 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                      <p className="text-amber-400 text-sm">⏳ Work submitted. Waiting for client approval...</p>
                    </div>
                  )}

                  {task.status === 'completed' && (
                    <div className="border-t border-[#1e2b1e] pt-4 p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                      <p className="text-green-400 text-sm">✓ Task completed! Payment has been credited to your wallet.</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
