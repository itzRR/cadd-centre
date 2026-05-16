"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Award, ChevronLeft, QrCode, Download } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { getMyCertificatesAction } from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function MyCertificatesPage() {
  const [certs, setCerts]     = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) { router.push("/auth/login"); return }
      const data = await getMyCertificatesAction()
      setCerts(data)
      setIsLoading(false)
    }
    load()
  }, [router])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ChevronLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
            <p className="text-sm text-gray-500">Download and verify your CADD Centre Lanka certificates</p>
          </div>
        </div>

        {certs.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center shadow-sm border border-gray-100">
            <Award className="h-14 w-14 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-700 mb-2">No certificates yet</h2>
            <p className="text-gray-400 text-sm mb-6">Complete a course to receive your CADD Centre Lanka certificate</p>
            <Button asChild variant="outline"><Link href="/courses">Browse Courses</Link></Button>
          </div>
        ) : (
          <div className="space-y-4">
            {certs.map(cert => (
              <div key={cert.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{cert.courses?.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{cert.courses?.level}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge className={cert.type === "professional_bim" ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"}>
                          {cert.type === "professional_bim" ? "Professional BIM" : "Course Completion"}
                        </Badge>
                        <span className="text-xs text-gray-400">Issued {new Date(cert.issued_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" title="QR Verification" onClick={() => alert(`Certificate: ${cert.certificate_number}\nVerify: ${cert.qr_code_data}`)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                    {cert.pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={cert.pdf_url} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4 mr-1" /> PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">Certificate Number</p>
                  <p className="font-mono text-sm font-semibold text-blue-700">{cert.certificate_number}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
