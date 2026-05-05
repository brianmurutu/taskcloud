import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error_description || error)}`, request.url))
  }

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (exchangeError) throw exchangeError
    } catch (err) {
      console.error('Code exchange failed:', err)
      return NextResponse.redirect(new URL('/auth/login?error=Authentication failed', request.url))
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
