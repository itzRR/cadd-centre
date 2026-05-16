"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FolderOpen, ChevronLeft, BookOpen, Video, FileText, Link2, ExternalLink } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getMyResourcesAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const TYPE_META: Record<string, { icon: any; color: string; badge: string }> = {
  ebook:    { icon: BookOpen, color: "text-blue-600",  badge: "bg-blue-100 text-blue-800" },
  video:    { icon: Video,    color: "text-red-600",   badge: "bg-red-100 text-red-800" },
  guide:    { icon: FileText, color: "text-green-600", badge: "bg-green-100 text-green-800" },
  document: { icon: Link2,    color: "text-gray-600",  badge: "bg-gray-100 text-gray-700" },
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([])
  const [filter, setFilter]       = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) { router.push("/auth/login"); return }
      const data = await getMyResourcesAction()
      setResources(data)
      setIsLoading(false)
    }
    load()
  }, [router])

  const TYPES = ["all", "ebook", "video", "guide", "document"]
  const filtered = filter === "all" ? resources : resources.filter(r => r.type === filter)

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ChevronLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Resources</h1>
            <p className="text-sm text-gray-500">E-books, video tutorials and BIM practice guides for your courses</p>
          </div>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${
                filter === t ? "bg-blue-600 text-white" : "bg-white text-gray-600 border hover:border-blue-300"
              }`}>
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <FolderOpen className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">No resources available</h2>
            <p className="text-gray-400 text-sm">Resources will appear here once you're enrolled in a course</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(r => {
              const meta = TYPE_META[r.type] || TYPE_META.document
              const Icon = meta.icon
              return (
                <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className={`h-5 w-5 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{r.title}</h3>
                    {r.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge className={meta.badge}>{r.type}</Badge>
                      {r.courses?.title && <span className="text-xs text-gray-400">{r.courses.title}</span>}
                      {r.modules?.title && <span className="text-xs text-gray-400">· {r.modules.title}</span>}
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="flex-shrink-0">
                    <a href={r.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                    </a>
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
