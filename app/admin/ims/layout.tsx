"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import type { AuthUser } from "@/lib/auth"

const ROLE_ALLOWED_PATHS: Record<string, string[]> = {
  academic_head:    ['/admin/ims/academic',  '/admin/ims/tasks', '/admin/ims/roster', '/admin/ims/dashboard'],
  academic_officer: ['/admin/ims/academic',  '/admin/ims/tasks', '/admin/ims/roster'],
  marketing_head:   ['/admin/ims/marketing', '/admin/ims/tasks', '/admin/ims/roster', '/admin/ims/dashboard'],
  marketing_officer:['/admin/ims/marketing', '/admin/ims/tasks', '/admin/ims/roster'],
  finance_head:     ['/admin/ims/finance',   '/admin/ims/tasks', '/admin/ims/roster', '/admin/ims/dashboard'],
  finance_officer:  ['/admin/ims/finance',   '/admin/ims/tasks', '/admin/ims/roster'],
  hr_head:          ['/admin/ims/hr',        '/admin/ims/tasks', '/admin/ims/roster', '/admin/ims/dashboard'],
  hr_officer:       ['/admin/ims/hr',        '/admin/ims/tasks', '/admin/ims/roster'],
  staff:            ['/admin/ims/tasks',      '/admin/ims/roster', '/admin/ims/dashboard'],
  lecturer:         ['/admin/ims/academic'],
}

const FULL_ACCESS = ['admin', 'super_admin']

export default function IMSLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) {
        router.push("/auth/login?redirect=/admin/ims&message=Please log in to access IMS")
        return
      }

      const hasFullAccess = FULL_ACCESS.includes(u.role)
      if (!hasFullAccess) {
        const allowed = ROLE_ALLOWED_PATHS[u.role] || []
        const isAllowed = allowed.some(p => pathname.startsWith(p)) || pathname === '/admin/ims'
        if (!isAllowed) {
          // Redirect to the first allowed path for this role
          const firstAllowed = allowed[0]
          if (firstAllowed) {
            router.push(firstAllowed)
          } else {
            router.push("/auth/login")
          }
          return
        }
      }

      setUser(u)
      setLoading(false)
    })
  }, [router, pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
