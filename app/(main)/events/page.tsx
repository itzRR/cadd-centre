"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Calendar, MapPin, Users, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { getEvents } from "@/lib/data"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Event } from "@/types"

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filtered, setFiltered] = useState<Event[]>([])
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getEvents(true).then((data) => { setEvents(data); setFiltered(data); setIsLoading(false) })
  }, [])

  useEffect(() => {
    let res = events
    if (search) res = res.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase()))
    if (category !== "all") res = res.filter(e => e.category === category)
    setFiltered(res)
  }, [search, category, events])

  const categories = ["all", ...Array.from(new Set(events.map(e => e.category)))]

  const getStatus = (e: Event) => {
    const now = new Date(), start = new Date(e.start_date)
    if (start < now) return { label: "Past", color: "bg-gray-100 text-gray-600" }
    if (start.getTime() - now.getTime() < 7 * 86400000) return { label: "This Week", color: "bg-yellow-100 text-yellow-700" }
    return { label: "Upcoming", color: "bg-emerald-100 text-emerald-700" }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Calendar className="h-14 w-14 mx-auto mb-6 text-purple-300" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events & Workshops</h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto mb-8">
            Attend live events, workshops, and seminars led by industry experts
          </p>
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." className="pl-12 py-3 text-gray-900 bg-white rounded-xl shadow-lg border-0 text-base" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${category === c ? "bg-purple-600 text-white" : "bg-white text-gray-600 border hover:border-purple-300"}`}>
              {c === "all" ? "All Categories" : c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-white rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600">No events found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((event) => {
              const status = getStatus(event)
              const spotsLeft = event.capacity - event.booked_count
              return (
                <Link key={event.id} href={`/events/${event.slug}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200 hover:-translate-y-1">
                  <div className="relative h-52 bg-gradient-to-br from-purple-600 to-indigo-700 overflow-hidden">
                    {event.image_url ? (
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="h-16 w-16 text-white/20" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={status.color}>{status.label}</Badge>
                      {event.is_featured && <Badge className="bg-yellow-400 text-yellow-900">Featured</Badge>}
                    </div>
                    {spotsLeft <= 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-center text-sm py-1.5 font-medium">Fully Booked</div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">{event.category}</p>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">{event.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.short_description || event.description}</p>
                    <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                      <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDate(event.start_date)}{event.start_time && ` at ${event.start_time}`}</div>
                      <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.venue}</div>
                      <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{spotsLeft > 0 ? `${spotsLeft} spots left` : "Fully booked"}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">{event.price === 0 ? "Free" : formatCurrency(event.price)}</span>
                      <span className="text-sm text-purple-600 font-medium group-hover:underline">Details →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
