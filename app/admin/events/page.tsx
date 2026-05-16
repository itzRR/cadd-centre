"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getEvents, deleteEvent } from "@/lib/data"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Event } from "@/types"
import { confirmDialog } from "@/components/ui/global-confirm-dialog"

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    setIsLoading(true)
    const data = await getEvents(false)
    setEvents(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!(await confirmDialog("Delete this event?"))) return
    await deleteEvent(id)
    loadEvents()
  }

  const getStatus = (event: Event) => {
    const now = new Date()
    const start = new Date(event.start_date)
    if (start < now) return { label: "Past", color: "bg-gray-100 text-gray-800" }
    const diff = start.getTime() - now.getTime()
    if (diff < 7 * 86400000) return { label: "Soon", color: "bg-yellow-100 text-yellow-800" }
    return { label: "Upcoming", color: "bg-green-100 text-green-800" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">{events.length} events total</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/admin/events/new"><Plus className="h-4 w-4 mr-2" />New Event</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No events found</p>
              <Button asChild><Link href="/admin/events/new">Create first event</Link></Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((event) => {
                  const status = getStatus(event)
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium line-clamp-1">{event.title}</p>
                          <p className="text-xs text-gray-500">{event.organizer}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(event.start_date)}</TableCell>
                      <TableCell className="text-sm max-w-[150px] truncate">{event.venue}</TableCell>
                      <TableCell>{event.price === 0 ? "Free" : formatCurrency(event.price)}</TableCell>
                      <TableCell>{event.booked_count}/{event.capacity}</TableCell>
                      <TableCell><Badge className={status.color}>{status.label}</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">•••</Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/events/${event.slug}`} target="_blank"><Eye className="h-4 w-4 mr-2" />View</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/events/${event.id}/edit`}><Edit className="h-4 w-4 mr-2" />Edit</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
