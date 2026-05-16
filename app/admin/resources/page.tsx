"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FolderOpen, Plus, BookOpen, Video, FileText, Link2 } from "lucide-react"
import { getAllResources, getCourses, getModulesByCourse, createResource } from "@/lib/data"
import { formatDateTime } from "@/lib/utils"

const TYPE_ICONS: Record<string, any> = {
  ebook: BookOpen, video: Video, guide: FileText, document: Link2,
}

const TYPE_COLORS: Record<string, string> = {
  ebook:    "bg-blue-100 text-blue-800",
  video:    "bg-red-100 text-red-800",
  guide:    "bg-green-100 text-green-800",
  document: "bg-gray-100 text-gray-800",
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [form, setForm] = useState({
    course_id: "", module_id: "", title: "", description: "", type: "document", url: ""
  })

  useEffect(() => {
    getAllResources().then(setResources).finally(() => setIsLoading(false))
    getCourses(false).then(setCourses)
  }, [])

  const handleCourseChange = async (courseId: string) => {
    setForm(f => ({ ...f, course_id: courseId, module_id: "" }))
    if (courseId) {
      const mods = await getModulesByCourse(courseId)
      setModules(mods)
    } else {
      setModules([])
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      const res = await createResource({
        course_id: form.course_id || undefined,
        module_id: form.module_id || undefined,
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        url: form.url,
      })
      setResources(prev => [res, ...prev])
      setForm({ course_id: "", module_id: "", title: "", description: "", type: "document", url: "" })
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Resources</h1>
          <p className="text-gray-600 mt-1">Manage e-books, video tutorials, BIM guides and practice materials</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Add Resource
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Upload / Link Resource</CardTitle></CardHeader>
          <CardContent>
            {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
            <form onSubmit={handleAdd} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.course_id} onChange={e => handleCourseChange(e.target.value)}>
                    <option value="">-- All courses --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Module</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.module_id} onChange={e => set("module_id", e.target.value)} disabled={!form.course_id}>
                    <option value="">-- All modules --</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input placeholder="e.g. Revit Architecture Step-by-Step Guide" value={form.title} onChange={e => set("title", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.type} onChange={e => set("type", e.target.value)}>
                    <option value="ebook">E-book</option>
                    <option value="video">Video / Tutorial</option>
                    <option value="guide">Practice Guide</option>
                    <option value="document">Document</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>URL / Link *</Label>
                <Input placeholder="https://..." value={form.url} onChange={e => set("url", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input placeholder="Brief description of this resource" value={form.description} onChange={e => set("description", e.target.value)} />
              </div>
              <div className="flex gap-3">
                <Button type="submit">Add Resource</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" /> All Resources ({resources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : resources.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No resources uploaded yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Course</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Module</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Added</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map(r => {
                    const Icon = TYPE_ICONS[r.type] || FileText
                    return (
                      <tr key={r.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{r.title}</span>
                          </div>
                          {r.description && <p className="text-xs text-gray-500 ml-6">{r.description}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={TYPE_COLORS[r.type]}>{r.type}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{r.courses?.title || "-"}</td>
                        <td className="py-3 px-4 text-gray-600">{r.modules?.title || "-"}</td>
                        <td className="py-3 px-4 text-gray-500 text-xs">{formatDateTime(r.created_at)}</td>
                        <td className="py-3 px-4">
                          <Button variant="outline" size="sm" asChild>
                            <a href={r.url} target="_blank" rel="noreferrer">Open</a>
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
