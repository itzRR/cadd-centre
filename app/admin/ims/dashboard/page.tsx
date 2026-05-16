"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser, getDefaultRoute } from "@/lib/auth"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function IMSDashboardRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    getCurrentUser().then(u => {
      if (!u) { router.push("/auth/login"); return }
      const route = getDefaultRoute(u.role)
      router.replace(route)
    })
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}



