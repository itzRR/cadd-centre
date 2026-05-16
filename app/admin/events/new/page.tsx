"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createEvent } from "@/lib/data"
import { slugify } from "@/lib/utils"

export default function NewEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [tagInput, setTagInput] = useState("")

  const [form, setForm] = useState({
    title: "", description: "", short_description: "",
    start_date: "", end_date: "", start_time: "", end_time: "",
    venue: "", capacity: "200", price: "0", category: "", organizer: "",
    image_url: "", is_active: true, is_featured: false,
    tags: [] as string[],
  })

  const set = (field: string, value: unknown) => setForm((p) => ({ ...p, [field]: value }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) { set("tags", [...form.tags, t]); setTagInput("") }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.start_date || !form.venue) {
      setError("Please fill in all required fields")
      return
    }
    setIsLoading(true)
    try {
      await createEvent({
        slug: slugify(form.title),
        title: form.title,
        description: form.description,
        short_description: form.short_description || undefined,
        start_date: form.start_date,
        end_date: form.end_date || undefined,
        start_time: form.start_time || undefined,
        end_time: form.end_time || undefined,
        venue: form.venue,
        capacity: Number(form.capacity),
        price: Number(form.price),
        category: form.category,
        organizer: form.organizer,
        image_url: form.image_url || undefined,
        tags: form.tags,
        agenda: [],
        speakers: [],
        is_active: form.is_active,
        is_featured: form.is_featured,
      })
      router.push("/admin/events")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create event")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild><Link href="/admin/events"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
        <h1 className="text-3xl font-bold text-gray-900">New Event</h1>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Event Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label>Title <span className="text-red-500">*</span></Label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Event title" required />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Short Description</Label>
                <Input value={form.short_description} onChange={(e) => set("short_description", e.target.value)} placeholder="One-line summary" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Full Description <span className="text-red-500">*</span></Label>
                <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} required />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Technology" />
              </div>
              <div className="space-y-2">
                <Label>Organizer</Label>
                <Input value={form.organizer} onChange={(e) => set("organizer", e.target.value)} placeholder="Organizing team/person" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Date, Time & Venue</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date <span className="text-red-500">*</span></Label><Input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} required /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} /></div>
            <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} /></div>
            <div className="space-y-2"><Label>End Time</Label><Input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} /></div>
            <div className="md:col-span-2 space-y-2"><Label>Venue <span className="text-red-500">*</span></Label><Input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Location name and address" required /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Capacity & Pricing</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
            <div className="space-y-2"><Label>Price (Rs.) - 0 for Free</Label><Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} /></div>
            <div className="space-y-2"><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Tags & Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium">Featured</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" asChild><Link href="/admin/events">Cancel</Link></Button>
          <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  )
}
