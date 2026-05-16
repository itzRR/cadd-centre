"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TestDbPage() {
  const [status, setStatus] = useState("Connecting...")
  useEffect(() => {
    supabase.from("courses").select("count", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (error) setStatus("Error: " + error.message)
        else setStatus(`Connected! ${count} courses in database.`)
      })
  }, [])
  return <div className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">DB Test</h1><p>{status}</p></div>
}
