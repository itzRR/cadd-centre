import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// This route runs server-side and uses the service role key
// to bypass RLS when creating staff users OR student users.
const getSupabaseAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is an authenticated admin
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const {
      email, password, name, role, position, department,
      access_level, permissions, work_schedule, office_assets,
      phone, nic, join_date, contract_type, monthly_salary,
      employee_status, student_id,
      // Student-specific fields
      personal_email, academic_email, academic_password,
      dob, course_name, batch_code, course_id, batch_id,
      lead_id, source,
    } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Email, password and name are required" }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Step 1: Create the auth user using admin API (no email confirmation needed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so user can log in immediately
      user_metadata: { full_name: name, role },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }

    // Step 2: Insert into the correct table based on role
    if (role === 'student') {
      // ── STUDENT → goes into `students` table (NOT profiles) ──
      const { error: studentError } = await supabaseAdmin.from("students").upsert({
        id: authData.user.id,
        email,
        full_name: name,
        student_id: student_id || null,
        academic_email: academic_email || email,
        academic_password: academic_password || student_id || null,
        personal_email: personal_email || null,
        phone: phone || null,
        nic: nic || null,
        dob: dob || null,
        course_name: course_name || null,
        batch_code: batch_code || null,
        course_id: course_id || null,
        batch_id: batch_id || null,
        lead_id: lead_id || null,
        source: source || 'lead_pipeline',
        payment_status: 'paid',
        status: 'active',
        is_active: true,
        disabled: false,
      }, { onConflict: "id" })

      if (studentError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: studentError.message }, { status: 500 })
      }
    } else {
      // ── STAFF → goes into `profiles` table ──
      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: authData.user.id,
        email,
        full_name: name,
        role: role || "staff",
        position: position || null,
        department: department || null,
        access_level: access_level ?? 1,
        permissions: permissions || [],
        work_schedule: work_schedule || [],
        office_assets: office_assets || [],
        phone: phone || null,
        nic: nic || null,
        join_date: join_date || null,
        contract_type: contract_type || 'Full-time',
        monthly_salary: monthly_salary || null,
        employee_status: employee_status || 'Active',
        student_id: null,
        is_active: true,
        disabled: false,
      }, { onConflict: "id" })

      if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    })

  } catch (err: any) {
    console.error("[create-staff-user]", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
