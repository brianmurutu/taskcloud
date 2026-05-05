import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// This route handles:
// 1. Google OAuth redirect callback
// 2. Email confirmation links (signup & password reset)
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // OAuth/email link errors come back as query params
  if (error) {
    console.error('[Auth Callback] Error:', error, errorDescription)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent(errorDescription ?? error)}`
    )
  }

  if (code) {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Exchange error:', exchangeError.message)
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
      )
    }

    // Successful auth — redirect to dashboard (or wherever `next` points)
    return NextResponse.redirect(`${requestUrl.origin}${next}`)
  }

  // No code — something went wrong upstream
  return NextResponse.redirect(
    `${requestUrl.origin}/auth/login?error=Missing+authorization+code`
  )
}
