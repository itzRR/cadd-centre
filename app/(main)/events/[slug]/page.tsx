"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Calendar, MapPin, Users, Clock,
  Tag, CheckCircle, Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { getEventBySlug } from "@/lib/data"
import { registerForEventAction, checkEventRegistrationAction } from "@/lib/actions"
import { getCurrentUser } from "@/lib/auth"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Event } from "@/types"

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegistered, setIsRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [regMsg, setRegMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  const [userReady, setUserReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const [e, user] = await Promise.all([
        getEventBySlug(slug),
        getCurrentUser(),
      ])
      setEvent(e)
      if (user && e) {
        const registered = await checkEventRegistrationAction(e.id)
        setIsRegistered(registered)
      }
      setUserReady(!!user)
      setIsLoading(false)
    }
    load()
  }, [slug])

  const handleRegister = async () => {
    const user = await getCurrentUser()
    if (!user) {
      router.push(`/auth/login?redirect=/events/${slug}`)
      return
    }
    if (!event) return

    setRegistering(true)
    setRegMsg(null)

    const { error } = await registerForEventAction(event.id)

    if (error === "already_registered") {
      setIsRegistered(true)
      setRegMsg({ type: "info", text: "You are already registered for this event." })
    } else if (error) {
      setRegMsg({ type: "error", text: error })
    } else {
      setIsRegistered(true)
      setRegMsg({ type: "success", text: "🎉 You're registered! Check your dashboard for details." })
    }

    setRegistering(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12 space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700">Event not found</h2>
          <Button asChild className="mt-4"><Link href="/events">Browse Events</Link></Button>
        </div>
      </div>
    )
  }

  const spotsLeft = event.capacity - event.booked_count
  const isFull = spotsLeft <= 0

  const msgColors = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    error: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-blue-50 text-blue-700 border border-blue-200",
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <Button variant="ghost" asChild className="text-purple-200 hover:text-white mb-6 -ml-2">
            <Link href="/events"><ArrowLeft className="h-4 w-4 mr-1" />All Events</Link>
          </Button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="bg-purple-700/50 text-purple-200">{event.category}</Badge>
                {event.is_featured && <Badge className="bg-yellow-400 text-yellow-900">⭐ Featured</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
              <p className="text-purple-200 text-lg mb-6">
                {event.short_description || event.description.slice(0, 160)}
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-purple-200">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{formatDate(event.start_date)}</span>
                {event.start_time && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />{event.start_time}{event.end_time && ` – ${event.end_time}`}
                  </span>
                )}
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{event.venue}</span>
                <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{event.booked_count} registered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
            </div>

            {event.agenda && event.agenda.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Agenda</h2>
                <div className="space-y-4">
                  {event.agenda.map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0">
                        {item.time}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        {item.speaker && <p className="text-sm text-gray-500 mt-0.5">by {item.speaker}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.speakers && event.speakers.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Speakers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {event.speakers.map((speaker, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {speaker.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{speaker.name}</p>
                        <p className="text-sm text-purple-600">{speaker.title}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{speaker.bio}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.tags && event.tags.length > 0 && (
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5" />Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag) => (
                    <span key={tag} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              {event.image_url && (
                <img src={event.image_url} alt={event.title} className="w-full h-44 object-cover rounded-xl mb-6" />
              )}

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {event.price === 0 ? "Free" : formatCurrency(event.price)}
                </span>
                {event.price > 0 && <p className="text-sm text-gray-500 mt-1">per person</p>}
              </div>

              {/* Register Button */}
              {isRegistered ? (
                <div className="space-y-3 mb-4">
                  <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 py-3 px-4 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Registered
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/dashboard">View in Dashboard →</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleRegister}
                  disabled={isFull || registering}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 text-base font-semibold rounded-xl mb-4 disabled:opacity-60"
                >
                  {registering ? (
                    <span className="flex items-center gap-2">
                      <LoadingSpinner size="sm" /> Registering...
                    </span>
                  ) : isFull ? (
                    "Fully Booked"
                  ) : !userReady ? (
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" /> Sign In to Register
                    </span>
                  ) : (
                    "Register Now"
                  )}
                </Button>
              )}

              {/* Register message */}
              {regMsg && (
                <div className={`text-sm px-3 py-2.5 rounded-xl mb-4 ${msgColors[regMsg.type]}`}>
                  {regMsg.text}
                </div>
              )}

              {!isFull && spotsLeft <= 20 && !isRegistered && (
                <p className="text-center text-sm text-orange-600 font-medium mb-4">
                  ⚡ Only {spotsLeft} spots left!
                </p>
              )}

              {/* Details */}
              <div className="space-y-3 text-sm text-gray-600 border-t pt-4">
                <div className="flex justify-between">
                  <span>Date</span>
                  <span className="font-medium text-gray-900">{formatDate(event.start_date)}</span>
                </div>
                {event.start_time && (
                  <div className="flex justify-between">
                    <span>Time</span>
                    <span className="font-medium text-gray-900">
                      {event.start_time}{event.end_time ? ` – ${event.end_time}` : ""}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Venue</span>
                  <span className="font-medium text-gray-900 text-right max-w-[150px]">{event.venue}</span>
                </div>
                <div className="flex justify-between">
                  <span>Capacity</span>
                  <span className="font-medium text-gray-900">{event.capacity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available</span>
                  <span className={`font-medium ${isFull ? "text-red-600" : "text-green-600"}`}>
                    {isFull ? "Full" : `${spotsLeft} spots`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Organizer</span>
                  <span className="font-medium text-gray-900">{event.organizer}</span>
                </div>
              </div>

              {!userReady && (
                <p className="text-center text-xs text-gray-400 mt-4">
                  <Link href="/auth/login" className="text-purple-600 hover:underline">Sign in</Link> or{" "}
                  <Link href="/auth/register" className="text-purple-600 hover:underline">register</Link> to book your spot
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
