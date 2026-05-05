'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Filter, ChevronLeft, ChevronRight, Star, Calendar, Users } from 'lucide-react'
import { supabase as supabaseClient } from '@/lib/supabase'
const supabase = supabaseClient as any
import { useAuth } from '@/lib/auth-context'
import { Task, CATEGORIES } from '@/types/database'
import { formatCurrency } from '@/lib/paystack'
import { formatDistanceToNow } from 'date-fns'

const PAGE_SIZE = 15

function TaskCard({ task, userId }: { task: Task; userId?: string }) {
  const hasApplied = task.my_application !== undefined
  const isOwner = task.poster_id === userId

  return (
    <Link href={`/tasks/${task.id}`} className="card-hover block">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge badge-green">{task.status}</span>
          <span className="badge badge-gray text-xs">{task.category}</span>
          {task.is_featured && <span className="badge badge-amber text-xs">⭐ Featured</span>}
        </div>
        {isOwner && <span className="badge badge-blue text-xs">Your Task</span>}
        {hasApplied && !isOwner && <span className="badge badge-amber text-xs">Applied</span>}
      </div>

      <h3 className="font-semibold text-white mb-2 line-clamp-2 leading-snug" style={{ fontFamily: 'Sora, sans-serif' }}>
        {task.title}
      </h3>

      <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
        {task.description}
      </p>

      {task.required_skills && task.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.required_skills.slice(0, 3).map(s => (
            <span key={s} className="badge badge-gray text-xs">{s}</span>
          ))}
          {task.required_skills.length > 3 && (
            <span className="badge badge-gray text-xs">+{task.required_skills.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-sm border-t border-[#1e2b1e] pt-3 mt-auto">
        <div className="font-bold text-green-400 text-base">
          {formatCurrency(task.budget, task.currency as 'KES' | 'USD')}
        </div>
        <div className="flex items-center gap-3 text-gray-600 text-xs">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {new Date(task.deadline) < new Date()
              ? <span className="text-red-400">Overdue</span>
              : formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
          </span>
          <span className="flex items-center gap-1"><Users size={11} />{task.application_count}</span>
        </div>
      </div>

      {task.poster && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#1e2b1e]">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold">
            {task.poster.full_name?.slice(0, 1)}
          </div>
          <span className="text-xs text-gray-600">{task.poster.full_name}</span>
          {task.poster.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-400 ml-auto">
              <Star size={10} className="fill-current" />
              {task.poster.rating.toFixed(1)}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

export default function DashboardTasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('created_at_desc')
  const [currency, setCurrency] = useState<'all' | 'KES' | 'USD'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [minBudget, setMinBudget] = useState('')
  const [maxBudget, setMaxBudget] = useState('')

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('tasks')
        .select('*, poster:profiles!poster_id(full_name, rating)', { count: 'exact' })
        .eq('status', 'open')

      if (search) query = query.ilike('title', `%${search}%`)
      if (category) query = query.eq('category', category)
      if (currency !== 'all') query = query.eq('currency', currency)
      if (minBudget) query = query.gte('budget', parseFloat(minBudget))
      if (maxBudget) query = query.lte('budget', parseFloat(maxBudget))

      const asc = sort.includes('asc')
      const field = sort.startsWith('budget') ? 'budget' : sort.startsWith('deadline') ? 'deadline' : 'created_at'
      query = query.order(field, { ascending: asc })
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      const { data, count } = await query

      // Check which tasks user has applied to
      if (user && data) {
        const taskIds = data.map((t: Task) => t.id)
        const { data: apps } = await supabase
          .from('applications')
          .select('task_id')
          .eq('applicant_id', user.id)
          .in('task_id', taskIds)

        const appliedSet = new Set(apps?.map(a => a.task_id))
        const tasksWithApps = data.map((t: Task) => ({
          ...t,
          my_application: appliedSet.has(t.id) ? {} : undefined,
        }))
        setTasks(tasksWithApps as Task[])
      } else {
        setTasks((data as Task[]) || [])
      }
      setTotal(count || 0)
    } finally {
      setLoading(false)
    }
  }, [search, category, sort, currency, page, minBudget, maxBudget, user])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>Browse Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">{total} open tasks available</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search tasks by title..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <div className="flex rounded-xl border border-[#1e2b1e] overflow-hidden shrink-0">
          {(['all', 'KES', 'USD'] as const).map(c => (
            <button
              key={c}
              onClick={() => { setCurrency(c); setPage(1) }}
              className={`px-3 py-2.5 text-sm transition-colors ${
                currency === c ? 'bg-green-500/15 text-green-400' : 'text-gray-500 bg-[#0e1a0e]'
              }`}
            >
              {c === 'all' ? 'All' : c === 'KES' ? '🇰🇪' : '🇺🇸'} {c !== 'all' && c}
            </button>
          ))}
        </div>

        <select
          className="input-field w-auto shrink-0"
          value={sort}
          onChange={e => { setSort(e.target.value); setPage(1) }}
        >
          <option value="created_at_desc">Newest</option>
          <option value="budget_desc">Highest Budget</option>
          <option value="budget_asc">Lowest Budget</option>
          <option value="deadline_asc">Deadline Soon</option>
        </select>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-ghost flex items-center gap-2 text-sm shrink-0 ${showFilters ? 'text-green-400' : ''}`}
        >
          <Filter size={14} /> Filters
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="card animate-slide-up">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <div className="font-medium text-white mb-3 text-sm">Category</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setCategory(''); setPage(1) }}
                  className={`badge cursor-pointer ${!category ? 'badge-green' : 'badge-gray'}`}
                >All</button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.slug}
                    onClick={() => { setCategory(cat.name); setPage(1) }}
                    className={`badge cursor-pointer ${category === cat.name ? 'badge-green' : 'badge-gray'}`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium text-white mb-3 text-sm">Budget Range</div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  className="input-field text-sm"
                  placeholder="Min"
                  value={minBudget}
                  onChange={e => { setMinBudget(e.target.value); setPage(1) }}
                />
                <span className="text-gray-600">—</span>
                <input
                  type="number"
                  className="input-field text-sm"
                  placeholder="Max"
                  value={maxBudget}
                  onChange={e => { setMaxBudget(e.target.value); setPage(1) }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton h-4 w-20 rounded mb-3" />
              <div className="skeleton h-5 w-full rounded mb-2" />
              <div className="skeleton h-4 w-3/4 rounded mb-4" />
              <div className="skeleton h-4 w-full rounded" />
            </div>
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-24">
          <Search size={48} className="text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No tasks found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} userId={user?.id} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost p-2 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost p-2 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
