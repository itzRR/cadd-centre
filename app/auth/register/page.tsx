"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace("/courses") }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1635 50%, #0a1628 100%)" }}>
      <p className="text-white/50 text-sm">Redirecting to courses…</p>
    </div>
  )
}
