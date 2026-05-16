"use client"

import { useState, useEffect, useCallback } from "react"
import { Mail, Check, MailOpen } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getContactMessages, markMessageAsRead } from "@/lib/data"
import { formatDateTime } from "@/lib/utils"
import type { ContactMessage } from "@/types"

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const data = await getContactMessages()
    setMessages(data)
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRead = async (id: string) => {
    await markMessageAsRead(id)
    load()
  }

  const unread = messages.filter(m => !m.is_read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">{unread} unread message{unread !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6 space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((msg) => (
                      <TableRow key={msg.id} className={`cursor-pointer ${!msg.is_read ? "bg-blue-50" : ""}`} onClick={() => setSelected(msg)}>
                        <TableCell>
                          <Badge className={msg.is_read ? "bg-gray-100 text-gray-600" : "bg-blue-100 text-blue-700"}>
                            {msg.is_read ? "Read" : "New"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{msg.name}</p>
                            <p className="text-xs text-gray-500">{msg.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium text-sm max-w-[180px] truncate">{msg.subject}</TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDateTime(msg.created_at)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          {!msg.is_read && (
                            <Button size="sm" variant="ghost" onClick={() => handleRead(msg.id)}>
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          {selected ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">{selected.subject}</h3>
                    <p className="text-sm text-gray-500 mt-1">{formatDateTime(selected.created_at)}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-gray-900">{selected.name}</p>
                  <p className="text-sm text-gray-600">{selected.email}</p>
                  {selected.phone && <p className="text-sm text-gray-600">{selected.phone}</p>}
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
                {!selected.is_read && (
                  <Button className="w-full mt-4" size="sm" onClick={() => handleRead(selected.id)}>
                    <MailOpen className="h-4 w-4 mr-2" />Mark as Read
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-8 text-center h-full flex items-center justify-center">
              <div>
                <Mail className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Select a message to read</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
