import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
const EXPECTED_SECRET = process.env.ZKTECO_SYNC_SECRET || "cadd_zkteco_secret_2026"

function getSupabaseAdmin() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret
    const authHeader = req.headers.get("x-zkteco-secret")
    if (authHeader !== EXPECTED_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!supabaseKey) {
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 })
    }

    const body = await req.json()
    const records: { device_id: string; timestamp: string }[] = body.records

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid payload format. Expected { records: [] }" }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    let processedCount = 0
    let skippedCount = 0

    // 2. Process Records
    for (const record of records) {
      const { device_id, timestamp } = record
      if (!device_id || !timestamp) continue

      // Find the user with this device_id
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('device_id', String(device_id))
        .single()

      if (!profile) {
        // Device ID not mapped to any employee yet
        skippedCount++
        continue
      }

      const scanTime = new Date(timestamp)
      const dateString = scanTime.toISOString().split('T')[0] // YYYY-MM-DD

      // Check if they already have an attendance record for today
      const { data: existingAtt } = await supabaseAdmin
        .from('staff_attendance')
        .select('id, time_in, time_out')
        .eq('user_id', profile.id)
        .eq('date', dateString)
        .single()

      if (!existingAtt) {
        // First scan of the day -> Clock IN
        // Check if late (e.g., after 08:45 AM)
        const hour = scanTime.getHours()
        const minutes = scanTime.getMinutes()
        const isLate = (hour > 8) || (hour === 8 && minutes > 45)

        await supabaseAdmin.from('staff_attendance').insert({
          user_id: profile.id,
          user_name: profile.full_name,
          date: dateString,
          time_in: scanTime.toISOString(),
          status: isLate ? 'late' : 'present',
        })
        processedCount++
      } else {
        // Subsequent scan of the day -> Clock OUT
        // Only update time_out if it's been at least 5 minutes since time_in (prevent double-taps)
        const timeIn = new Date(existingAtt.time_in)
        const diffMinutes = (scanTime.getTime() - timeIn.getTime()) / 1000 / 60

        if (diffMinutes > 5) {
          // If we already have a time_out, only update it if this scan is later
          if (!existingAtt.time_out || new Date(existingAtt.time_out) < scanTime) {
            await supabaseAdmin
              .from('staff_attendance')
              .update({ time_out: scanTime.toISOString() })
              .eq('id', existingAtt.id)
            processedCount++
          } else {
            skippedCount++
          }
        } else {
          skippedCount++
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: processedCount, 
      skipped: skippedCount 
    }, { status: 200 })

  } catch (error: any) {
    console.error("ZKTeco Sync Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
