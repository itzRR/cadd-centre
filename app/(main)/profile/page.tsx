"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronLeft, Sparkles } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getFullProfileAction } from "@/lib/actions"
import ProfileSection from "@/components/ims/ProfileSection"

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) { router.push("/auth/login"); return }
      const p = await getFullProfileAction()
      if (p) {
        setProfile(p)
      }
      setIsLoading(false)
    }
    load()
  }, [router])

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-t-2 border-blue-600 border-solid rounded-full mb-4" />
      <p className="text-gray-400 text-sm font-bold uppercase tracking-widest animate-pulse">Loading Profile...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-500/20">
      {/* Subtle blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100 blur-[100px] rounded-full opacity-30" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">

        {/* Nav bar */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Link href="/dashboard"
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all group">
              <ChevronLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">My Profile</h1>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-0.5">Personal Identity Hub</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Active Session</span>
          </div>
        </motion.div>

        <ProfileSection userData={profile} />

      </div>
    </div>
  )
}
