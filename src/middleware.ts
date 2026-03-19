import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type UserRole = 'student' | 'admin' | 'coach' | 'verzuim'

function dashboardForRole(role: UserRole | null | undefined): string {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'coach') return '/coach/dashboard'
  if (role === 'verzuim') return '/verzuim/dashboard'
  return '/student/dashboard'
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/register', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route => path === route)

  // If user is not logged in and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // If user is logged in and trying to access auth pages, redirect to their dashboard
  if (user && (path === '/auth/login' || path === '/auth/register')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = dashboardForRole((userData as { role: UserRole } | null)?.role)
    return NextResponse.redirect(url)
  }

  // Role-based access control for /admin/*
  if (user && path.startsWith('/admin')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (userData as { role: UserRole } | null)?.role
    if (userRole !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = dashboardForRole(userRole)
      return NextResponse.redirect(url)
    }
  }

  // Role-based access control for /student/*
  if (user && path.startsWith('/student')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (userData as { role: UserRole } | null)?.role
    if (userRole !== 'student') {
      const url = request.nextUrl.clone()
      url.pathname = dashboardForRole(userRole)
      return NextResponse.redirect(url)
    }
  }

  // Role-based access control for /coach/*
  if (user && path.startsWith('/coach')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (userData as { role: UserRole } | null)?.role
    if (userRole !== 'coach') {
      const url = request.nextUrl.clone()
      url.pathname = dashboardForRole(userRole)
      return NextResponse.redirect(url)
    }
  }

  // Role-based access control for /verzuim/*
  if (user && path.startsWith('/verzuim')) {
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = (userData as { role: UserRole } | null)?.role
    if (userRole !== 'verzuim') {
      const url = request.nextUrl.clone()
      url.pathname = dashboardForRole(userRole)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
