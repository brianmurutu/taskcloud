import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.')
}

// Client-side client (for components)
export const supabase = createClientComponentClient<Database>()

// Server-side client with service role (for background tasks/admin ops)
export const createServerSupabaseClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing. This is required for server-side operations.')
  }
  return createClient<Database>(
    supabaseUrl,
    serviceKey,
    { auth: { persistSession: false } }
  )
}
