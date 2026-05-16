"use client"

import type React from "react"
import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCourseById, updateCourse } from "@/lib/data"
import { slugify } from "@/lib/utils"

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [form, setFormState] = useState({
    title: "",
    description: "",
    short_description: "",
    price: "",
    original_price: "",
    total_hours: "80",
    level: "Proficient Certificate",
    category: "BIM",
    image_url: "",
    tags: [] as string[],
    is_active: true,
    is_featured: false,
  })

  const set = (field: string, value: unknown) => setFormState((prev) => ({ ...prev, [field]: value }))

  useEffect(() => {
    getCourseById(id).then((course) => {
      if (!course) {
        setError("Course not found")
        setIsFetching(false)
        return
      }
      setFormState({
        title: course.title,
        description: course.description,
        short_description: course.short_description || "",
        price: String(course.price ?? ""),
        original_price: course.original_price ? String(course.original_price) : "",
        total_hours: String(course.total_hours ?? 80),
        level: course.level,
        category: course.category,
        image_url: course.image_url || "",
        tags: course.tags || [],
        is_active: course.is_active,
        is_featured: course.is_featured,
      })
      setIsFetching(false)
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to load course")
      setIsFetching(false)
    })
  }, [id])

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      set("tags", [...form.tags, tag])
      setTagInput("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await updateCourse(id, {
        slug: slugify(form.title),
        title: form.title,
        description: form.description,
        short_description: form.short_description || undefined,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : undefined,
        total_hours: Number(form.total_hours),
        level: form.level,
        category: form.category,
        image_url: form.image_url || undefined,
        tags: form.tags,
        is_active: form.is_active,
        is_featured: form.is_featured,
      })
      router.push("/admin/courses")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update course")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) return <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" /></div>

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild><Link href="/admin/courses"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link></Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Course</h1>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Course Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
              <div className="space-y-2 md:col-span-2"><Label>Short Description</Label><Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} required /></div>
              <div className="space-y-2"><Label>Level</Label><select className="w-full rounded-md border px-3 py-2 text-sm" value={form.level} onChange={(e) => set("level", e.target.value)}><option>Proficient Certificate</option><option>Master Certificate</option><option>Expert Certificate</option></select></div>
              <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
              <div className="space-y-2"><Label>Total Hours</Label><Input type="number" min="1" value={form.total_hours} onChange={(e) => set("total_hours", e.target.value)} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} /></div>
              <div className="space-y-2"><Label>Price (Rs.)</Label><Input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
              <div className="space-y-2"><Label>Original Price (Rs.)</Label><Input type="number" min="0" value={form.original_price} onChange={(e) => set("original_price", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tags & Publishing</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag..." />
                <Button type="button" onClick={addTag} variant="outline"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-800">
                    {tag}<button type="button" onClick={() => set("tags", form.tags.filter((item) => item !== tag))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 rounded" /><span className="text-sm font-medium">Active</span></label>
              <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="h-4 w-4 rounded" /><span className="text-sm font-medium">Featured</span></label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild><Link href="/admin/courses">Cancel</Link></Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">{isLoading ? "Saving..." : "Save Changes"}</Button>
        </div>
      </form>
    </div>
  )
}
