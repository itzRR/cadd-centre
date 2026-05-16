"use client"

import type React from "react"
import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getEventById, updateEvent } from "@/lib/data"
import { slugify } from "@/lib/utils"

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [isFetching, setIsFetching] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [form, setFormState] = useState({
    title: "", description: "", short_description: "",
    start_date: "", end_date: "", start_time: "", end_time: "",
    venue: "", capacity: "200", price: "0", category: "", organizer: "",
    image_url: "", is_active: true, is_featured: false,
    tags: [] as string[],
  })
  const set = (f: string, v: unknown) => setFormState((p) => ({ ...p, [f]: v }))

  useEffect(() => {
    getEventById(id).then((ev) => {
      if (!ev) { setError("Event not found"); setIsFetching(false); return }
      setFormState({
        title: ev.title, description: ev.description,
        short_description: ev.short_description || "",
        start_date: ev.start_date, end_date: ev.end_date || "",
        start_time: ev.start_time || "", end_time: ev.end_time || "",
        venue: ev.venue, capacity: ev.capacity.toString(),
        price: ev.price.toString(), category: ev.category,
        organizer: ev.organizer, image_url: ev.image_url || "",
        is_active: ev.is_active, is_featured: ev.is_featured,
        tags: ev.tags || [],
      })
      setIsFetching(false)
    })
  }, [id])

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) { set("tags", [...form.tags, t]); setTagInput("") }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await updateEvent(id, {
        slug: slugify(form.title),
        title: form.title, description: form.description,
        short_description: form.short_description,
        start_date: form.start_date, end_date: form.end_date || undefined,
        start_time: form.start_time || undefined, end_time: form.end_time || undefined,
        venue: form.venue, capacity: Number(form.capacity),
        price: Number(form.price), category: form.category,
        organizer: form.organizer, image_url: form.image_url,
        tags: form.tags, is_active: form.is_active, is_featured: form.is_featured,
      })
      router.push("/admin/events")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update event")
    } finally {
      setIsLoading(false)
    }
  }

  if (isFetching) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild><Link href="/admin/events"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
        <h1 className="text-3xl font-bold">Edit Event</h1>
      </div>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
              <div className="md:col-span-2 space-y-2"><Label>Short Description</Label><Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} /></div>
              <div className="md:col-span-2 space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} /></div>
              <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
              <div className="space-y-2"><Label>Organizer</Label><Input value={form.organizer} onChange={(e) => set("organizer", e.target.value)} /></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Date, Time & Venue</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></div>
            <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} /></div>
            <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} /></div>
            <div className="md:col-span-2 space-y-2"><Label>Venue</Label><Input value={form.venue} onChange={(e) => set("venue", e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Capacity, Pricing & Tags</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
              <div className="space-y-2"><Label>Price (Rs.)</Label><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
              <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add tag..." />
                <Button type="button" onClick={addTag} variant="outline"><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {tag}<button type="button" onClick={() => set("tags", form.tags.filter((t) => t !== tag))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm font-medium">Active</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="w-4 h-4 rounded" /><span className="text-sm font-medium">Featured</span></label>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild><Link href="/admin/events">Cancel</Link></Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">{isLoading ? "Saving..." : "Save Changes"}</Button>
        </div>
      </form>
    </div>
  )
}
