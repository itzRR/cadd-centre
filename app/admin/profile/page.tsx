"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import ProfileSection from "@/components/ims/ProfileSection"
import type { Profile } from "@/types"

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const load = async () => {
      try {
        const user = await getCurrentUser()
        if (!user) { router.push("/auth/login"); return }

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (data) setProfile(data as Profile)
      } catch (err) {
        console.error("Failed to load profile:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Profile not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 selection:bg-blue-500/20">
      {/* Subtle blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 blur-[120px] rounded-full opacity-50" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100 blur-[100px] rounded-full opacity-30" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <ProfileSection
          userData={profile}
          onUpdateProfile={(data) => setProfile(prev => prev ? { ...prev, ...data } : prev)}
        />
      </div>
    </div>
  )
}
