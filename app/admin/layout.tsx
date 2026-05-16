"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getCurrentUser, canAccessAdmin, getDefaultRoute } from "@/lib/auth"
import type { AuthUser } from "@/lib/auth"
import { Menu, GraduationCap } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (!u) {
        router.push("/auth/login?redirect=/admin&message=Please log in to access the admin panel")
        return
      }
      if (!canAccessAdmin(u.role)) {
        router.push(getDefaultRoute(u.role))
        return
      }
      setUser(u)
      setIsLoading(false)
    })
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500 mt-3">Verifying access...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const isImsPage = pathname.startsWith('/admin/ims')
  // Only dept dashboards with their OWN built-in sidebars render full-page
  const isFullPageIms = pathname.match(/^\/admin\/ims(\/(finance|hr|academic|marketing))?$/)

  if (isFullPageIms) {
    return <div className="bg-gray-50 min-h-screen">{children}</div>
  }

  return (
    <div className={`flex h-screen overflow-hidden ${isImsPage ? 'bg-gray-50' : 'bg-gray-100'}`}>
      <AdminSidebar currentUser={user} mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <main className="flex-1 overflow-hidden flex flex-col h-screen">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#0A1A2F] text-white p-4 flex items-center justify-between z-30 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-bold text-lg leading-none">CADD Centre</h1>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {isImsPage ? (
            children
          ) : (
            <div className="p-4 md:p-6">{children}</div>
          )}
        </div>
      </main>
    </div>
  )
}
