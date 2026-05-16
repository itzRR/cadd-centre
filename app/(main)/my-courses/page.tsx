"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BookOpen, CheckCircle, Clock, ArrowRight, ChevronLeft, Layers,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getUserEnrollmentsAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatDate } from "@/lib/utils"

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [isLoading, setIsLoading]     = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) { router.push("/auth/login?redirect=/my-courses"); return }
      const data = await getUserEnrollmentsAction()
      setEnrollments(data)
      setIsLoading(false)
    }
    load()
  }, [router])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>
  )

  const completed = enrollments.filter(e => e.status === "completed")
  const active    = enrollments.filter(e => e.status !== "completed")

  const levelColor = (l: string) =>
    l === "Expert Certificate"   ? "bg-purple-100 text-purple-800" :
    l === "Master Certificate"   ? "bg-blue-100 text-blue-800" :
                                    "bg-green-100 text-green-800"

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
        </div>
        <p className="text-gray-500 text-sm mb-8 ml-8">
          {enrollments.length} course{enrollments.length !== 1 ? "s" : ""} enrolled
          {completed.length > 0 && ` · ${completed.length} completed`}
        </p>

        {enrollments.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <BookOpen className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">No courses yet</h2>
            <p className="text-gray-400 text-sm mb-6">Browse CADD programmes and start your training</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {active.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  In Progress - {active.length}
                </h2>
                <div className="space-y-4">
                  {active.map(enrollment => (
                    <EnrollmentCard key={enrollment.id} enrollment={enrollment} levelColor={levelColor} />
                  ))}
                </div>
              </section>
            )}
            {completed.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                  Completed - {completed.length}
                </h2>
                <div className="space-y-4">
                  {completed.map(enrollment => (
                    <EnrollmentCard key={enrollment.id} enrollment={enrollment} levelColor={levelColor} completed />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EnrollmentCard({ enrollment, levelColor, completed = false }: any) {
  const course = enrollment.courses
  const modules = course?.modules || []
  const isCompleted = enrollment.status === "completed"

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-start gap-4 mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isCompleted ? "bg-emerald-100" : "bg-blue-100"}`}>
          {isCompleted
            ? <CheckCircle className="h-6 w-6 text-emerald-600" />
            : <BookOpen className="h-6 w-6 text-blue-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900">{course?.title}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {course?.level && <Badge className={levelColor(course.level)}>{course.level}</Badge>}
            {course?.category && <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{course.category}</span>}
            {enrollment.batch && <span className="text-xs text-gray-500">{enrollment.batch.name}</span>}
            <Badge className={isCompleted ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>{enrollment.status}</Badge>
          </div>
        </div>
        <Link href={`/courses/${course?.slug}`}>
          <Button variant="outline" size="sm" className="gap-1 flex-shrink-0">
            View <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      {/* Module breakdown */}
      {modules.length > 0 && (
        <div className="border-t border-gray-50 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Modules ({modules.length})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[...modules].sort((a: any, b: any) => a.order_index - b.order_index).map((mod: any, i: number) => (
              <div key={mod.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                <span className="text-sm text-gray-700 flex-1 truncate">{mod.title}</span>
                <span className="text-xs text-gray-400">{mod.duration_hours}h</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-gray-50 pt-3 mt-4">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3" /> Enrolled {new Date(enrollment.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
