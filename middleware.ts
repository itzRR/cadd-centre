import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { hasPermission, PATH_PERMISSION_MAP } from '@/lib/permissions'
import type { Permission } from '@/lib/permissions'
import type { UserRole } from '@/types'

// Student-facing protected routes
const PROTECTED_ROUTES = ['/dashboard', '/profile', '/my-courses', '/my-attendance', '/my-results', '/my-progress', '/my-certificates', '/resources']
const ADMIN_ROUTES = ['/admin']

// All roles that can access /admin (staff + lecturer)
const ADMIN_CAPABLE_ROLES = [
  'admin', 'super_admin',
  'academic_head', 'academic_officer',
  'finance_head', 'finance_officer',
  'marketing_head', 'marketing_officer',
  'hr_head', 'hr_officer',
  'staff', 'lecturer',
]

// IMS-only roles: if they visit /admin top-level, redirect to their section
const IMS_ONLY_ROLES = [
  'academic_head', 'academic_officer',
  'finance_head', 'finance_officer',
  'marketing_head', 'marketing_officer',
  'hr_head', 'hr_officer',
  'staff', 'lecturer',
]

// Default redirect for IMS-only roles
const IMS_REDIRECT: Record<string, string> = {
  academic_head:    '/admin/ims/academic',
  academic_officer: '/admin/ims/academic',
  marketing_head:   '/admin/ims/marketing',
  marketing_officer:'/admin/ims/marketing',
  finance_head:     '/admin/ims/finance',
  finance_officer:  '/admin/ims/finance',
  hr_head:          '/admin/ims/hr',
  hr_officer:       '/admin/ims/hr',
  staff:            '/admin/ims/tasks',
  lecturer:         '/admin/ims/academic',
}

type CookieToSet = { name: string; value: string; options?: CookieOptions }

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route))
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  if (!isAdminRoute && !isProtectedRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user }, error } = await supabase.auth.getUser()
  const isAuthenticated = !!user && !error

  if (isAdminRoute) {
    if (!isAuthenticated) {
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('redirect', pathname)
      url.searchParams.set('message', 'Please sign in to access the admin panel')
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, disabled, permissions, task_delete_permission')
      .eq('id', user.id)
      .single()

    const role = (profile?.role ?? 'student') as UserRole

    if (profile?.disabled) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login?message=Account+disabled', request.url))
    }

    if (!ADMIN_CAPABLE_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Full admins always pass through
    const isFullAdmin = ['admin', 'super_admin'].includes(role)
    if (isFullAdmin) return response

    // For non-full-admin roles, check the specific path permission
    const grantedPermissions: Permission[] = (profile?.permissions as Permission[]) || []

    // Find the most-specific path match
    const matched = PATH_PERMISSION_MAP.find(({ pathPrefix }) =>
      pathname === pathPrefix || pathname.startsWith(pathPrefix + '/')
    )

    if (matched) {
      const allowed = hasPermission(role, grantedPermissions, matched.permission)
      if (!allowed) {
        // Redirect IMS-only roles to their home section; others to /admin
        const fallback = IMS_ONLY_ROLES.includes(role)
          ? IMS_REDIRECT[role] || '/admin/ims/tasks'
          : '/admin'
        return NextResponse.redirect(new URL(fallback, request.url))
      }
      return response
    }

    // Visiting /admin (ASMS dashboard) - IMS-only roles without asms_full get redirected
    if (pathname === '/admin' || pathname.startsWith('/admin/') && !pathname.startsWith('/admin/ims')) {
      const hasAsms = hasPermission(role, grantedPermissions, 'asms_full')
      if (!hasAsms && IMS_ONLY_ROLES.includes(role)) {
        return NextResponse.redirect(new URL(IMS_REDIRECT[role] || '/admin/ims/tasks', request.url))
      }
    }
  }

  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', pathname)
    url.searchParams.set('message', 'Please sign in to continue')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/my-courses/:path*',
    '/my-attendance/:path*',
    '/my-results/:path*',
    '/my-progress/:path*',
    '/my-certificates/:path*',
    '/resources/:path*',
  ],
}
