import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase Service Role configuration.")
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    })

    const { data, error } = await supabaseAdmin
      .schema('storage')
      .from('objects')
      .select('bucket_id, metadata')

    if (error) throw error

    let totalSizeBytes = 0
    const bucketSizes: Record<string, number> = {}

    data?.forEach(obj => {
      // metadata is typically a JSON object containing the 'size' in bytes
      const size = obj.metadata?.size || 0
      totalSizeBytes += size
      
      const bucketName = obj.bucket_id || 'unknown'
      bucketSizes[bucketName] = (bucketSizes[bucketName] || 0) + size
    })

    return NextResponse.json({ 
      success: true, 
      totalSizeBytes, 
      bucketSizes 
    })
  } catch (error: any) {
    console.error("Storage API Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
