"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

/**
 * Generic redirect page — replaces legacy admin routes
 * that have been consolidated into IMS department dashboards.
 */
export default function RedirectPage({ target }: { target: string }) {
  const router = useRouter()
  useEffect(() => { router.replace(target) }, [router, target])
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-sm text-gray-500">Redirecting…</p>
    </div>
  )
}
