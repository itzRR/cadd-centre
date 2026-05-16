"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, UserCheck } from "lucide-react"
import { getBatchById, updateBatch, getLecturersProfiles, allocateLecturer, removeLecturerAllocation } from "@/lib/data"

export default function EditBatchPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [lecturers, setLecturers] = useState<any[]>([])
  const [currentAllocation, setCurrentAllocation] = useState<{ id: string; lecturer_id: string } | null>(null)
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', schedule: '', mode: 'classroom', venue: '', seats: '20', is_active: true, lecturer_id: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      getBatchById(params.id),
      getLecturersProfiles()
    ]).then(([batch, lecs]: [any, any]) => {
      setLecturers(lecs)
      if (!batch) return

      // Get existing lecturer allocation
      const alloc = batch.lecturer_allocations?.[0]
      if (alloc) {
        setCurrentAllocation({ id: alloc.id, lecturer_id: alloc.lecturer_id })
      }

      setForm({
        name: batch.name || '',
        start_date: batch.start_date || '',
        end_date: batch.end_date || '',
        schedule: batch.schedule || '',
        mode: batch.mode || 'classroom',
        venue: batch.venue || '',
        seats: String(batch.seats || 20),
        is_active: !!batch.is_active,
        lecturer_id: alloc?.lecturer_id || '',
      })
    }).finally(() => setIsLoading(false))
  }, [params.id])

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSaving(true)
    try {
      // Update batch details
      await updateBatch(params.id, { 
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date,
        schedule: form.schedule,
        mode: form.mode,
        venue: form.venue,
        seats: parseInt(form.seats, 10),
        is_active: form.is_active,
      } as any)

      // Handle lecturer allocation changes
      const oldLecturerId = currentAllocation?.lecturer_id || ''
      const newLecturerId = form.lecturer_id

      if (oldLecturerId !== newLecturerId) {
        // Remove old allocation if exists
        if (currentAllocation?.id) {
          await removeLecturerAllocation(currentAllocation.id)
        }
        // Create new allocation if a lecturer is selected
        if (newLecturerId) {
          await allocateLecturer(params.id, newLecturerId)
        }
      }

      router.push('/admin/batches')
    } catch (err: any) {
      setError(err.message || 'Failed to update batch')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild><Link href="/admin/batches"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link></Button>
        <div><h1 className="text-2xl font-bold text-gray-900">Edit Batch</h1><p className="text-gray-600 text-sm">Update timetable, seats, delivery mode, lecturer and status</p></div>
      </div>
      <Card>
        <CardHeader><CardTitle>Batch Details</CardTitle></CardHeader>
        <CardContent>
          {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
          {isLoading ? <div className="h-48 bg-gray-100 rounded animate-pulse" /> : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Batch Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} required /></div>
                <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Schedule *</Label><Input value={form.schedule} onChange={e => set('schedule', e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Mode</Label><select className="w-full border rounded-md px-3 py-2 text-sm" value={form.mode} onChange={e => set('mode', e.target.value)}><option value="classroom">Classroom</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></div>
                <div className="space-y-2"><Label>Seats</Label><Input type="number" min="1" value={form.seats} onChange={e => set('seats', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Venue / Platform</Label><Input value={form.venue} onChange={e => set('venue', e.target.value)} /></div>

              {/* Lecturer Assignment */}
              <div className="space-y-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                <Label className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-blue-600" /> Assigned Lecturer</Label>
                <select
                  className="w-full border border-blue-200 bg-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.lecturer_id}
                  onChange={e => set('lecturer_id', e.target.value)}
                >
                  <option value="">-- No Lecturer Assigned --</option>
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>{l.full_name}{l.specialization ? ` — ${l.specialization}` : ''}</option>
                  ))}
                </select>
                {currentAllocation && form.lecturer_id !== currentAllocation.lecturer_id && (
                  <p className="text-xs text-amber-600 font-medium">⚠ Lecturer will be changed when you save.</p>
                )}
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} /> Batch active</label>
              <div className="flex gap-3 pt-2"><Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button><Button type="button" variant="outline" onClick={() => router.push('/admin/batches')}>Cancel</Button></div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
