"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Clock, BookOpen, CheckCircle, Lock,
  Layers, Award, GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getCourseBySlug } from "@/lib/data"
import { enrollInCourseAction, checkEnrollmentAction } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import type { Course } from "@/types"

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [course, setCourse]       = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const [c, u] = await Promise.all([getCourseBySlug(slug), getCurrentUser()])
      setCourse(c)
      setUser(u)
      if (u && c) setIsEnrolled(await checkEnrollmentAction(c.id))
      setIsLoading(false)
    }
    load()
  }, [slug])

  const handleEnroll = async () => {
    if (!user) { router.push(`/auth/login?redirect=/courses/${slug}`); return }
    setEnrolling(true)
    const { error } = await enrollInCourseAction(course!.id)
    if (!error) {
      setIsEnrolled(true)
      setMsg({ type: "success", text: "Enrolled successfully! Access your course from the student portal." })
    } else if (error === "already_enrolled") {
      setMsg({ type: "info", text: "You are already enrolled in this course." })
    } else {
      setMsg({ type: "error", text: error })
    }
    setEnrolling(false)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Course not found</p>
        <Button asChild variant="outline"><Link href="/courses">Back to Courses</Link></Button>
      </div>
    </div>
  )

  const levelColor =
    course.level === "Expert Certificate"   ? "bg-purple-100 text-purple-800" :
    course.level === "Master Certificate"   ? "bg-blue-100 text-blue-800" :
                                              "bg-green-100 text-green-800"

  const msgStyle = msg?.type === "success" ? "bg-green-50 text-green-800 border-green-200" :
                   msg?.type === "info"    ? "bg-blue-50 text-blue-800 border-blue-200" :
                                             "bg-red-50 text-red-800 border-red-200"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A1A2F] to-[#0D2340] text-white pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          <Link href="/courses" className="inline-flex items-center gap-2 text-blue-300 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> All Courses
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={levelColor}>{course.level}</Badge>
                <Badge className="bg-white/10 text-white border-white/20">{course.category}</Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-blue-200 text-lg mb-6">{course.short_description || course.description}</p>
              <div className="flex flex-wrap gap-4 text-sm text-blue-200">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {course.total_hours} hours</span>
                <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" /> {course.modules?.length || 0} modules</span>
                <span className="flex items-center gap-1.5"><Award className="h-4 w-4" /> {course.level}</span>
              </div>
            </div>

            {/* Enroll Card */}
            <div className="bg-white rounded-2xl p-6 text-gray-900 shadow-2xl self-start">
              {course.image_url && (
                <img src={course.image_url} alt={course.title} className="w-full h-36 object-cover rounded-xl mb-4" />
              )}
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatCurrency(course.price)}</span>
                {course.original_price && (
                  <span className="text-gray-400 line-through ml-2">{formatCurrency(course.original_price)}</span>
                )}
              </div>

              {msg && (
                <div className={`text-sm px-3 py-2 rounded-lg mb-4 border ${msgStyle}`}>{msg.text}</div>
              )}

              {isEnrolled ? (
                <div>
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-4 py-3 mb-3">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">Enrolled</span>
                  </div>
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard">Go to My Portal</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleEnroll} disabled={enrolling}>
                    {enrolling ? "Enrolling..." : user ? "Enroll Now" : "Sign In to Enroll"}
                  </Button>
                  {!user && (
                    <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1">
                      <Lock className="h-3 w-3" /> Sign in required to enroll
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> {course.total_hours} total hours</div>
                <div className="flex items-center gap-2"><Layers className="h-4 w-4 text-gray-400" /> {course.modules?.length || 0} modules</div>
                <div className="flex items-center gap-2"><Award className="h-4 w-4 text-gray-400" /> Certificate upon completion</div>
                <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-gray-400" /> {course.level}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-4">About This Programme</h2>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>

          {/* Modules */}
          {course.modules && course.modules.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <Layers className="h-5 w-5 text-blue-600" /> Course Modules
              </h2>
              <div className="space-y-4">
                {[...course.modules].sort((a: any, b: any) => a.order_index - b.order_index).map((mod: any, i: number) => (
                  <div key={mod.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900">{mod.title}</h3>
                          {mod.description && <p className="text-sm text-gray-500 mt-0.5">{mod.description}</p>}
                        </div>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 text-xs ml-3 flex-shrink-0">{mod.duration_hours}h</Badge>
                    </div>
                    {mod.topics && mod.topics.length > 0 && (
                      <div className="ml-10 grid grid-cols-1 md:grid-cols-2 gap-1">
                        {mod.topics.map((topic: string) => (
                          <div key={topic} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            {topic}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {course.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" /> What You Get
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Practical & theory training</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Module-wise progress tracking</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Access to BIM tutorials & guides</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> Module tests & final evaluation</li>
              <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" /> QR-verified certificate</li>
            </ul>
          </div>

          <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
            <h3 className="font-bold text-blue-900 mb-2">Need more info?</h3>
            <p className="text-sm text-blue-700 mb-4">Contact CADD Centre Lanka for batch schedules and registration assistance.</p>
            <Button asChild variant="outline" className="w-full border-blue-300 text-blue-700 hover:bg-blue-100">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
