'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, ChevronLeft, ChevronRight, Zap, Calendar, User, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Task, CATEGORIES } from '@/types/database'
import { formatCurrency } from '@/lib/paystack'
import { formatDistanceToNow } from 'date-fns'

const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Newest First' },
  { value: 'budget_desc', label: 'Highest Budget' },
  { value: 'budget_asc', label: 'Lowest Budget' },
  { value: 'deadline_asc', label: 'Deadline Soon' },
]

const PAGE_SIZE = 12

function TaskCard({ task }: { task: Task }) {
  const statusColors: Record<string, string> = {
    open: 'badge-green',
    assigned: 'badge-blue',
    completed: 'badge-gray',
  }

  return (
    <Link href={`/tasks/${task.id}`} className="card-hover block">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`badge ${statusColors[task.status] || 'badge-gray'}`}>
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </span>
        <span className="badge badge-gray text-xs">{task.category}</span>
      </div>

      <h3 className="font-semibold text-white mb-2 line-clamp-2 leading-snug" style={{ fontFamily: 'Sora, sans-serif' }}>
        {task.title}
      </h3>

      <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed">
        {task.description}
      </p>

      <div className="flex items-center justify-between text-sm border-t border-[#1e2b1e] pt-4 mt-auto">
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
          <span className="flex items-center gap-1">
            <User size={11} />
            {task.application_count} bids
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function TasksPage() {
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState('created_at_desc')
  const [currency, setCurrency] = useState<'KES' | 'USD'>('KES')
  const [showFilters, setShowFilters] = useState(false)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('tasks')
        .select('*, poster:profiles!poster_id(full_name, rating, avatar_url)', { count: 'exact' })
        .eq('status', 'open')

      if (search) query = query.ilike('title', `%${search}%`)
      if (category) query = query.eq('category', category)
      if (currency) query = query.eq('currency', currency)

      const [sortField, sortDir] = sort.split('_desc')[0].split('_asc')[0] === sort.split('_')[0]
        ? [sort.replace('_desc', '').replace('_asc', ''), sort.includes('_desc') ? false : true]
        : [sort, true]

      const field = sortField === 'created_at' ? 'created_at'
        : sortField === 'budget' ? 'budget'
        : sortField === 'deadline' ? 'deadline'
        : 'created_at'

      query = query.order(field, { ascending: sort.includes('asc') })
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      const { data, count } = await query
      setTasks((data as Task[]) || [])
      setTotal(count || 0)
    } finally {
      setLoading(false)
    }
  }, [search, category, sort, currency, page])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#1e2b1e] bg-[#0a0f0d]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
              <Zap size={14} className="text-black" />
            </div>
            <span className="font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>TaskCloud</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
            <Link href="/auth/signup" className="btn-primary py-2 text-sm">Sign Up</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>
            Browse Tasks
          </h1>
          <p className="text-gray-500">{total} open tasks available</p>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              className="input-field pl-11"
              placeholder="Search tasks..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>

          {/* Currency toggle */}
          <div className="flex rounded-xl border border-[#1e2b1e] overflow-hidden">
            {(['KES', 'USD'] as const).map(c => (
              <button
                key={c}
                onClick={() => { setCurrency(c); setPage(1) }}
                className={`px-4 py-3 text-sm font-medium transition-colors ${
                  currency === c
                    ? 'bg-green-500/15 text-green-400'
                    : 'text-gray-500 hover:text-gray-300 bg-[#0e1a0e]'
                }`}
              >
                {c === 'KES' ? '🇰🇪 KES' : '🇺🇸 USD'}
              </button>
            ))}
          </div>

          <select
            className="input-field w-auto"
            value={sort}
            onChange={e => { setSort(e.target.value); setPage(1) }}
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Filter size={14} /> Filters {category && <span className="text-green-400">•</span>}
          </button>
        </div>

        {/* Category filter */}
        {showFilters && (
          <div className="mb-8 p-4 card animate-slide-up">
            <div className="font-medium text-white mb-3 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>Category</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setCategory(''); setPage(1) }}
                className={`badge cursor-pointer transition-colors ${!category ? 'badge-green' : 'badge-gray hover:badge-green'}`}
              >
                All
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => { setCategory(cat.name); setPage(1) }}
                  className={`badge cursor-pointer transition-colors ${category === cat.name ? 'badge-green' : 'badge-gray'}`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tasks grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
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
            <DollarSign size={48} className="text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No tasks found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map(task => <TaskCard key={task.id} task={task} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost p-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-ghost p-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
