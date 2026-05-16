import { getCertificateVerification } from "@/lib/data"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle } from "lucide-react"

export default async function VerifyCertificatePage({ params }: { params: Promise<{ certificateNumber: string }> }) {
  const { certificateNumber } = await params
  const certificate = await getCertificateVerification(decodeURIComponent(certificateNumber))

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-2xl mx-auto bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-900 text-white p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Certificate Verification</p>
          <h1 className="text-2xl font-bold mt-2">CADD Centre Lanka</h1>
        </div>
        <div className="p-6 space-y-6">
          {certificate ? (
            <>
              <div className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-xl p-4">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <p className="font-semibold">Valid certificate</p>
                  <p className="text-sm">This certificate number exists in the ASMS registry.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">Certificate Number</p><p className="font-semibold">{certificate.certificate_number}</p></div>
                <div><p className="text-slate-500">Issued On</p><p className="font-semibold">{new Date(certificate.issued_at).toLocaleString()}</p></div>
                <div><p className="text-slate-500">Student</p><p className="font-semibold">{certificate.students?.full_name || '-'}</p></div>
                <div><p className="text-slate-500">Student ID</p><p className="font-semibold">{certificate.students?.student_id || '-'}</p></div>
                <div><p className="text-slate-500">Course</p><p className="font-semibold">{certificate.courses?.title || '-'}</p></div>
                <div><p className="text-slate-500">Level</p><Badge className="bg-blue-100 text-blue-800">{certificate.courses?.level || '-'}</Badge></div>
              </div>
              {certificate.pdf_url && <a className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium" href={certificate.pdf_url} target="_blank">Open certificate PDF</a>}
            </>
          ) : (
            <div className="flex items-center gap-3 text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
              <XCircle className="h-6 w-6" />
              <div>
                <p className="font-semibold">Certificate not found</p>
                <p className="text-sm">The provided certificate number does not exist in the current registry.</p>
              </div>
            </div>
          )}
          <Link href="/" className="text-sm text-blue-600 hover:underline">Back to home</Link>
        </div>
      </div>
    </div>
  )
}
