"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/contact") }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-500 font-bold tracking-widest uppercase text-sm">Redirecting to Enquiry Form…</p>
      </div>
    </div>
  )
}
