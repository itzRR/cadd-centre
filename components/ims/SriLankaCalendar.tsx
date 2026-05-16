"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, isToday, parseISO, addMonths, subMonths } from "date-fns"
import { ChevronLeft, ChevronRight, Plus, X, Edit, Trash2, CalendarDays, Cloud, CloudRain, Sun, Wind, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import {
  getWorkCalendarEvents, createWorkCalendarEvent,
  updateWorkCalendarEvent, deleteWorkCalendarEvent,
  type WorkCalendarEvent,
} from "@/lib/ims-data"

// Sri Lanka public holidays 2025-2026 (key = YYYY-MM-DD)
const SL_HOLIDAYS: Record<string, string> = {
  "2025-01-01": "New Year's Day", "2025-01-14": "Thai Pongal",
  "2025-02-04": "National Day", "2025-02-12": "Maha Sivarathri",
  "2025-02-14": "Milad-un-Nabi", "2025-03-31": "Id ul Fitr",
  "2025-04-13": "Sinhala & Tamil New Year Eve", "2025-04-14": "Sinhala & Tamil New Year",
  "2025-04-18": "Good Friday", "2025-05-01": "May Day",
  "2025-05-05": "Vesak Poya", "2025-05-06": "Day after Vesak",
  "2025-06-07": "Id ul Alha", "2025-06-10": "Poson Poya",
  "2025-07-12": "Esala Poya", "2025-08-08": "Nikini Poya",
  "2025-09-06": "Binara Poya", "2025-10-02": "Id ul Milad",
  "2025-10-05": "Vap Poya", "2025-10-20": "Deepavali",
  "2025-11-04": "Il Poya", "2025-12-03": "Unduvap Poya",
  "2025-12-25": "Christmas Day",
  "2026-01-01": "New Year's Day", "2026-01-14": "Thai Pongal",
  "2026-02-04": "National Day", "2026-02-20": "Maha Sivarathri",
  "2026-03-20": "Id ul Fitr", "2026-04-13": "Sinhala & Tamil New Year Eve",
  "2026-04-14": "Sinhala & Tamil New Year", "2026-05-01": "May Day",
  "2026-05-02": "Good Friday", "2026-05-24": "Vesak Poya",
  "2026-06-23": "Poson Poya", "2026-12-25": "Christmas Day",
}

const CATEGORIES = ["Work", "Meeting", "Deadline", "Leave", "Task", "Other"] as const
const CAT_COLORS: Record<string, string> = {
  Work:     "#3b82f6", Meeting: "#8b5cf6", Deadline: "#ef4444",
  Leave:    "#f59e0b", Task:    "#10b981", Other:    "#6b7280",
}

interface WeatherInfo {
  temp: number
  desc: string
  icon: string
}

function WeatherIcon({ icon, size = 16 }: { icon: string; size?: number }) {
  if (icon.includes("01")) return <Sun size={size} className="text-yellow-400" />
  if (icon.includes("02") || icon.includes("03") || icon.includes("04")) return <Cloud size={size} className="text-gray-400" />
  if (icon.includes("09") || icon.includes("10") || icon.includes("11")) return <CloudRain size={size} className="text-blue-400" />
  return <Wind size={size} className="text-gray-400" />
}

export default function SriLankaCalendar({ accentColor = "blue" }: { accentColor?: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<WorkCalendarEvent[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string>("")
  const [userName, setUserName] = useState<string>("")

  // Event form
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<WorkCalendarEvent | null>(null)
  const [form, setForm] = useState({ title: "", date: "", end_date: "", start_time: "", end_time: "", category: "Work" as WorkCalendarEvent["category"], color: "#3b82f6", notes: "" })

  const accentMap: Record<string, string> = {
    blue: "bg-blue-600", purple: "bg-purple-600", orange: "bg-orange-500",
    emerald: "bg-emerald-500", cyan: "bg-cyan-500",
  }
  const accentBg = accentMap[accentColor] || accentMap.blue

  // Load user then events
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id)
        const name = data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "User"
        setUserName(name)
      }
    })
  }, [])

  const loadEvents = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getWorkCalendarEvents(userId)
      setEvents(data)
    } catch (e: any) { toast.error("Could not load events") }
    finally { setLoading(false) }
  }, [userId])

  useEffect(() => { loadEvents() }, [loadEvents])

  // Fetch Kandy weather
  useEffect(() => {
    const cached = sessionStorage.getItem("kandy_weather")
    if (cached) { setWeather(JSON.parse(cached)); return }
    fetch("https://api.openweathermap.org/data/2.5/weather?q=Kandy,LK&units=metric&appid=bd5e378503939ddaee76f12ad7a97608")
      .then(r => r.json())
      .then(d => {
        if (d.main) {
          const w = { temp: Math.round(d.main.temp), desc: d.weather[0].description, icon: d.weather[0].icon }
          setWeather(w)
          sessionStorage.setItem("kandy_weather", JSON.stringify(w))
        }
      })
      .catch(() => {})
  }, [])

  // Calendar grid
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart) // 0=Sunday

  const eventsForDay = (day: Date) =>
    events.filter(e => {
      try { return isSameDay(parseISO(e.date), day) } catch { return false }
    })

  const holidayForDay = (day: Date) => SL_HOLIDAYS[format(day, "yyyy-MM-dd")]

  // Modal helpers
  const openAdd = (day?: Date) => {
    setEditingEvent(null)
    setForm({ title: "", date: day ? format(day, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"), end_date: "", start_time: "", end_time: "", category: "Work", color: "#3b82f6", notes: "" })
    setShowModal(true)
  }
  const openEdit = (ev: WorkCalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingEvent(ev)
    setForm({ title: ev.title, date: ev.date, end_date: ev.end_date || "", start_time: ev.start_time || "", end_time: ev.end_time || "", category: ev.category, color: ev.color, notes: ev.notes || "" })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return toast.error("Title and date required")
    try {
      if (editingEvent) {
        const updated = await updateWorkCalendarEvent(editingEvent.id, { ...form })
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e))
        toast.success("Event updated")
      } else {
        const created = await createWorkCalendarEvent({ ...form, uid: userId, user_name: userName })
        setEvents(prev => [...prev, created])
        toast.success("Event added")
      }
      setShowModal(false)
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteWorkCalendarEvent(id)
      setEvents(prev => prev.filter(ev => ev.id !== id))
      toast.success("Event deleted")
    } catch (e: any) { toast.error(e.message) }
  }

  const selectedDayEvents = selectedDay ? eventsForDay(selectedDay) : []
  const selectedHoliday = selectedDay ? holidayForDay(selectedDay) : undefined

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-blue-500" /> Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sri Lanka - Personal Work Events</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {weather && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm shadow-sm">
              <WeatherIcon icon={weather.icon} />
              <span className="font-bold text-gray-800">{weather.temp}°C</span>
              <span className="text-gray-500 capitalize hidden sm:block">{weather.desc}</span>
              <span className="text-blue-500 font-medium text-xs hidden md:block">· Kandy</span>
            </div>
          )}
          <button onClick={() => openAdd()} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg transition-all">
            <Plus className="h-4 w-4" /> Add Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Month Navigation */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-gray-900 text-lg">{format(currentMonth, "MMMM yyyy")}</h2>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-600 hover:text-gray-900">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-800">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs font-bold text-white py-3 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Padding cells */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={"pad" + i} className="border-r border-b min-h-[80px] bg-gray-50/50" />
            ))}
            {days.map(day => {
              const dayEvents = eventsForDay(day)
              const holiday = holidayForDay(day)
              const isSel = selectedDay && isSameDay(day, selectedDay)
              const isWeekend = getDay(day) === 0 || getDay(day) === 6

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSel ? null : day)}
                  className={`border-r border-b min-h-[80px] p-1.5 cursor-pointer transition-colors relative group
                    ${isSel ? "bg-blue-50 ring-2 ring-inset ring-blue-500" : "hover:bg-gray-50"}
                    ${isWeekend ? "bg-red-50/30" : ""}
                  `}
                >
                  <div className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-1
                    ${isToday(day) ? `${accentBg} text-white` : isWeekend ? "text-red-500" : "text-gray-700"}
                  `}>
                    {format(day, "d")}
                  </div>
                  {holiday && (
                    <div className="text-[9px] text-green-600 font-semibold leading-tight truncate mb-0.5 bg-green-50 rounded px-0.5">
                      🎉 {holiday}
                    </div>
                  )}
                  {dayEvents.slice(0, 2).map(ev => (
                    <div
                      key={ev.id}
                      className="text-[9px] text-white px-1 py-0.5 rounded mb-0.5 truncate font-medium"
                      style={{ backgroundColor: ev.color || "#3b82f6" }}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] text-gray-400">+{dayEvents.length - 2} more</div>
                  )}
                  <button
                    onClick={e => { e.stopPropagation(); openAdd(day) }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-200 rounded"
                  >
                    <Plus className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="bg-white rounded-2xl border p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Categories</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <div key={cat} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CAT_COLORS[cat] }} />
                  <span className="text-gray-600">{cat}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-2.5 h-2.5 rounded bg-green-50 border border-green-300" />
              Public Holiday
            </div>
          </div>

          {/* Selected day panel */}
          {selectedDay ? (
            <div className="bg-white rounded-2xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">{format(selectedDay, "EEEE, MMMM d, yyyy")}</p>
                  {selectedHoliday && (
                    <Badge className="bg-green-100 text-green-700 text-xs mt-1">🎉 {selectedHoliday}</Badge>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => openAdd(selectedDay)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No events this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map(ev => (
                    <div key={ev.id} className="flex items-start justify-between p-2.5 rounded-xl border" style={{ borderLeftColor: ev.color, borderLeftWidth: 3 }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{ev.title}</p>
                        <p className="text-xs text-gray-500">{ev.category}{ev.start_time ? ` · ${ev.start_time}` : ""}{ev.end_time ? ` – ${ev.end_time}` : ""}</p>
                        {ev.notes && <p className="text-xs text-gray-400 truncate">{ev.notes}</p>}
                      </div>
                      <div className="flex gap-0.5 ml-2 flex-shrink-0">
                        <button onClick={e => openEdit(ev, e)} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={e => handleDelete(ev.id, e)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming Events</p>
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
              ) : (
                <div className="space-y-2">
                  {events
                    .filter(e => { try { return parseISO(e.date) >= new Date() } catch { return false } })
                    .slice(0, 6)
                    .map(ev => (
                      <div key={ev.id} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate text-xs">{ev.title}</p>
                          <p className="text-[10px] text-gray-400">{ev.date}</p>
                        </div>
                      </div>
                    ))
                  }
                  {events.filter(e => { try { return parseISO(e.date) >= new Date() } catch { return false } }).length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-2">No upcoming events</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SL Holiday Embed */}
          <div className="bg-white rounded-2xl border overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide p-3 border-b">🇱🇰 SL Calendar</p>
            <div className="h-48 overflow-hidden">
              <iframe
                src="https://calendar.google.com/calendar/embed?src=en.lk%23holiday%40group.v.calendar.google.com&ctz=Asia%2FColombo&mode=AGENDA&showTitle=0&showNav=0&showPrint=0&showCalendars=0&showTabs=0&showTz=0&height=192"
                style={{ border: 0, width: "100%", height: "100%" }}
                title="Sri Lanka Holidays"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-lg">{editingEvent ? "Edit Event" : "Add Event"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Event title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as WorkCalendarEvent["category"], color: CAT_COLORS[e.target.value] || "#3b82f6" }))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input type="color" className="w-full h-10 border rounded-lg cursor-pointer" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-1">
                <Button className="flex-1" onClick={handleSave}>{editingEvent ? "Update" : "Add"}</Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
