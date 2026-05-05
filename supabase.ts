import { createClientComponentClient, createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

// ─── Browser / Client Components ─────────────────────────────────────────────
// Use this in any 'use client' component
export const createClient = () =>
  createClientComponentClient<Database>()

// ─── Server Components ────────────────────────────────────────────────────────
// Use this in Server Components (no 'use client')
export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies })

// ─── Server Actions & Route Handlers ─────────────────────────────────────────
// Use this inside server actions or API route handlers
export const createActionClient = () =>
  createServerActionClient<Database>({ cookies })
